import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Modal from 'antd/lib/modal';
import classNames from 'classnames';
import $ from 'jquery';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { connect, Provider } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import MultiGrid from 'react-virtualized/dist/commonjs/MultiGrid';
import ReactWordcloud from 'react-wordcloud';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import { GridCacheMem } from '../../api/GridCacheMem';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import datasetsReq, { DatasetLifecycle, DatasetLifecycleDesc } from '../../stores/reducers/datasets';
import featureGroups, { FeatureGroupVersionLifecycle, FeatureGroupsState } from '../../stores/reducers/featureGroups';
import { memProjectById } from '../../stores/reducers/projects';
import UtilsTS from '../../UtilsTS';
import ChartOutliers from '../ChartOutliers/ChartOutliers';
import ChartXYExt from '../ChartXYExt/ChartXYExt';
import DateOld from '../DateOld/DateOld';
import FilterByColumns from '../FilterByColumns/FilterByColumns';
import HelpIcon from '../HelpIcon/HelpIcon';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import PartsLink from '../NavLeft/PartsLink';
import NumberPretty from '../NumberPretty/NumberPretty';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';
import { RootState } from '../../../core/store';
import { FetchStateEnum } from '../../stores/commonTypes';

const { confirm } = Modal;

const s = require('./FeatureGroupsDataExplorerOne.module.css');
const sd = require('../antdUseDark.module.css');

const topAfterHeaderHH = 60 + 20;

const espRow = 0;
const cellHH = 54;

interface IFeatureGroupsDataExplorerOneProps {
  paramsProp?: any;
  projects?: any;
  projectDatasets?: any;
  defDatasets?: any;
  featureGroups?: FeatureGroupsState;
  datasets?: any;
  onChangeProject?: (key: any) => void;
}

interface IFeatureGroupsDataExplorerOneState {
  scrollToRow?: number;
  scrollToColumn?: number;
  scrollTopGrid?: any;
  chartsUuid?: string;
  hoveredChart?: string;
  selectedColumns?: any;
  selectedColumnsNonIgnored?: any;
  selectedColumnsText?: string;
  isApproximateCount?: boolean;
  approximateCountsMessage?: string;
  showGrid: boolean;
  isGridRenderInitialized: boolean;
  isDataFetchError: boolean;
  dataFetchErrorMsg: string;
}

class FeatureGroupsDataExplorerOne extends React.PureComponent<IFeatureGroupsDataExplorerOneProps, IFeatureGroupsDataExplorerOneState> {
  private unDark: any;
  cacheGrid = new GridCacheMem();
  private timeoutCallRangeRender: any;
  // private gridRef: any;
  private lastRangeGridRender: { columnOverscanStartIndex: any; columnOverscanStopIndex: any; rowOverscanStopIndex: any; columnStopIndex: any; rowStartIndex: any; columnStartIndex: any; rowStopIndex: any; rowOverscanStartIndex: any };
  private isM: boolean;
  private confirmValues: any;
  private alreadyHasData: boolean;
  private hoverTimeoutId: any;

  constructor(props) {
    super(props);

    this.state = {
      chartsUuid: null,
      hoveredChart: null,
      showGrid: false,
      isDataFetchError: false,
      dataFetchErrorMsg: Constants.errorDefault,
      isGridRenderInitialized: false,
    };

    this.cacheGrid.onNeedCache = this.cacheOnNeedCache;
    this.cacheGrid.hasNewData = this.cacheHasNewData;
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

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    let featureGroupId = this.props.paramsProp?.get('featureGroupId');
    let featureGroupVersion = this.calcFeatureGroupVersion();

    let projectId = this.calcProjectId();
    let batchPredId = this.props.paramsProp?.get('batchPredId');
    let modelVersion = this.props.paramsProp?.get('modelVersion');

    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);

    let listProjFG = this.memProjectFG(true)(this.props.featureGroups, projectId);

    let featuresGroupsVersionsList = this.memFGVersions(true)(this.props.featureGroups, featureGroupId);

    let featureGroupOne = this.memFeatureGroup(true)(this.props.featureGroups, projectId, featureGroupId);
    let featureGroupVersionOne = this.memFeatureGroupVersion(true)(this.props.featureGroups, featureGroupId, featureGroupVersion);

    let fgSchema1 = this.memFGSchema(true)(this.props.featureGroups, featureGroupVersion);

    let datasetOne = this.memDatasetsOne(true)(this.props.datasets, featureGroupOne?.datasetId);

    this.memFindField(this.alreadyHasData, this.calcFeatureGroupVersion(), this.props.paramsProp?.get('findField'));
  };

  memFindField = memoizeOne((alreadyHasData, fgVersion, findField) => {
    if (!Utils.isNullOrEmpty(findField) && fgVersion && alreadyHasData) {
      REClient_.client_().getFeatureGroupVersionMetricsData(null, fgVersion, 0, 1000, 0, 0, null, null, (err, res) => {
        let list = res?.result?.data;
        if (list != null && _.isArray(list)) {
          let ind1 = _.findIndex(list, (r1) => r1[0] === findField);
          if (ind1 > -1) {
            this.setState(
              {
                scrollToRow: ind1 + 3,
              },
              () => {
                setTimeout(() => {
                  this.setState({
                    scrollToRow: undefined,
                  });
                }, 100);
              },
            );
          }
        }
      });
    }
  });

  memFGVersonsOptions = memoizeOne((fgVersionsList) => {
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
    return res;
  });

  memFGVersions = memoizeOneCurry((doCall, featureGroupsParam, featureGroupId) => {
    return featureGroups.memFeatureGroupsVersionsForFeatureGroupId(doCall, featureGroupId);
  });

  componentDidUpdate(prevProps: Readonly<IFeatureGroupsDataExplorerOneProps>, prevState: Readonly<IFeatureGroupsDataExplorerOneState>, snapshot?: any): void {
    this.doMem();
  }

  calcDatasetId = () => {
    return this.props.paramsProp?.get('datasetId');
  };

  calcBatchPredId = () => {
    return this.props.paramsProp?.get('batchPredId');
  };

  calcProjectId = () => {
    let res = this.props.paramsProp?.get('projectId');
    if (res === '-') {
      res = null;
    }
    return res;
  };

  calcFeatureGroupId = () => {
    return this.props.paramsProp?.get('featureGroupId');
  };

  calcModelVersion = () => {
    return this.props.paramsProp?.get('modelVersion');
  };

  cacheHasNewData = () => {
    this.alreadyHasData = true;
    this.forceUpdate();
  };

  onChangeSelectedColumns = (columnsList, isNonIgnored, findText) => {
    this.setState({
      selectedColumns: columnsList,
      selectedColumnsNonIgnored: isNonIgnored,
      selectedColumnsText: findText,
    });
  };

  cacheOnNeedCache = async (fromRow: number, toRow: number, fromCol: number, toCol: number): Promise<any> => {
    return new Promise((resolve, reject) => {
      REClient_.client_().getFeatureGroupVersionMetricsData(this.calcProjectId(), this.calcFeatureGroupVersion(), fromRow, toRow, fromCol, toCol, this.state.selectedColumns, this.state.selectedColumnsNonIgnored, (err, res) => {
        let resData = res?.result?.data;
        this.setState({ isGridRenderInitialized: true });
        if (err) {
          this.setState({ showGrid: false, isDataFetchError: true, dataFetchErrorMsg: err || Constants.errorDefault });
          REActions.addNotificationError(err || Constants.errorDefault);
          Utils.error('Error: ' + err);
        } else if (!err && resData && resData.length > 0) {
          if (res?.result?.approximate_counts === true) {
            if (!this.state.isApproximateCount) {
              this.setState({
                isApproximateCount: true,
              });
            }
          } else {
            if (this.state.isApproximateCount) {
              this.setState({
                isApproximateCount: false,
              });
            }
          }

          if (res?.result?.approximate_counts_message) {
            this.setState({
              approximateCountsMessage: res?.result?.approximate_counts_message,
            });
          } else {
            this.setState({
              approximateCountsMessage: null,
            });
          }

          const nestedFeature = this.calcNestedFeature();
          let nestedFeatureData = res.result.nested_schema?.[nestedFeature]?.data;

          const fieldNameIndex = this.getFieldFromName('name')?.index;
          const fieldTypeIndex = this.getFieldFromName('data_type')?.index;
          const fieldChartsIndex = this.getFieldFromName('charts')?.index;

          if (nestedFeature && nestedFeatureData) {
            const selectedColumn = this.state.selectedColumnsText?.toLowerCase();
            if (selectedColumn) {
              nestedFeatureData = nestedFeatureData?.sort((a, b) => {
                if (a[fieldNameIndex].toLowerCase().startsWith(selectedColumn)) {
                  return -1;
                }
                if (b[fieldNameIndex].toLowerCase().startsWith(selectedColumn)) {
                  return 1;
                }

                return 0;
              });
            }
            resData = nestedFeatureData?.length > toRow ? nestedFeatureData?.slice(fromRow, toRow + 1) : nestedFeatureData;
          } else {
            const fgSchema = this.memFGSchema(false)(this.props.featureGroups, this.calcFeatureGroupVersion());
            const nestedSchema = fgSchema?.get('nested_schema')?.toJS();
            if (_.isArray(resData) && nestedSchema) {
              for (const [key, value] of Object.entries(nestedSchema)) {
                if (typeof value === 'object') {
                  const arr = new Array(toCol - fromCol + 1).fill('N/A');
                  if (fromCol <= fieldNameIndex && fieldNameIndex <= toCol) {
                    arr[fieldNameIndex - fromCol] = '->' + key;
                  }
                  if (fromCol <= fieldTypeIndex && fieldTypeIndex <= toCol) {
                    arr[fieldTypeIndex - fromCol] = '->' + key;
                  }
                  if (fromCol <= fieldChartsIndex && fieldChartsIndex <= toCol && value?.['rowCount']) {
                    arr[fieldChartsIndex - fromCol] = `(${value?.['rowCount']} nested columns)`;
                  }

                  resData.push(arr);
                }
              }
            }
          }

          this.setState({ showGrid: true, isDataFetchError: false });

          resolve(resData);
        } else {
          this.setState({ showGrid: false, isDataFetchError: false });
          resolve(null);
        }
      });
    });
  };

  onDarkModeChanged = (isDark) => {
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
      this.timeoutCallRangeRender = null;
      this.memGetCache(this.cacheGrid.useId, rowOverscanStartIndex, rowOverscanStopIndex, columnOverscanStartIndex, columnOverscanStopIndex + 1, true);
    }, 200);
  };

  onClickFromNested = (e) => {
    let projectId = this.calcProjectId();
    let featureGroupId = this.calcFeatureGroupId();
    let featureGroupVersion = this.props.paramsProp?.get('featureGroupVersion');

    this.setState({ scrollToRow: 1, scrollToColumn: 1 });
    Location.push('/' + PartsLink.feature_groups_data_explorer + '/' + (projectId ?? '-') + '/' + featureGroupId + `${featureGroupVersion ? '?featureGroupVersion=' + encodeURIComponent(featureGroupVersion) : ''}`);
  };

  onClickToNested = (content, e) => {
    let projectId = this.calcProjectId();
    let featureGroupId = this.calcFeatureGroupId();
    let featureGroupVersion = this.props.paramsProp?.get('featureGroupVersion');

    this.setState({ scrollToRow: 1, scrollToColumn: 1 });
    Location.push(
      '/' +
        PartsLink.feature_groups_data_explorer +
        '/' +
        (projectId ?? '-') +
        '/' +
        featureGroupId +
        `${featureGroupVersion ? '?featureGroupVersion=' + encodeURIComponent(featureGroupVersion) + '&nested=' + encodeURIComponent(content ?? '') : '?nested=' + encodeURIComponent(content ?? '')}`,
    );
  };

  onClickViewValues = (chartData, e) => {
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
              <TableExt separator1 autoFilter={['textSearch']} noAutoTooltip height={500} columns={columns} dataSource={dataList} isVirtual isDetailTheme={false} whiteText />
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

  setHoverItem = (rowIndex, columnIndex) => {
    clearTimeout(this.hoverTimeoutId);
    this.hoverTimeoutId = null;
    this.setState({ hoveredChart: `${rowIndex}-${columnIndex}` });
  };

  removeHoverItem = () => {
    this.hoverTimeoutId = setTimeout(() => {
      this.setState({ hoveredChart: null });
    }, 3000);
  };

  cellRenderer = ({
    columnIndex, // Horizontal (column) index of cell
    isScrolling, // The Grid is currently being scrolled
    isVisible, // This cell is visible within the grid (e.g. it is not an overscanned cell)
    key, // Unique key within array of cells
    parent, // Reference to the parent Grid (instance)
    rowIndex, // Vertical (row) index of cell
    style, // Style object to be applied to cell (to position it);
    // This must be passed through to the rendered cell element.
  }) => {
    let content: any = '';

    let getValue = (row, col) => {
      let cc = this.cacheGrid.onScroll(row, row, col, col, false);

      let res: any = null;
      cc &&
        cc.some((c1) => {
          if (!c1.isRetrieving && row >= c1.fromRow && row <= c1.toRow && col >= c1.fromCol && col <= c1.toCol) {
            if (c1.data) {
              let c2 = c1.data[row - c1.fromRow];
              if (c2) {
                res = c2[col - c1.fromCol];
              }
            }
            return true;
          }
        });

      return res;
    };

    if (rowIndex === 0) {
      if (columnIndex === 0) {
        content = '';
      } else {
        let field1 = this.getFieldFromIndex(columnIndex - 1);
        content = 'Col: ' + columnIndex;
        if (field1) {
          if (field1) {
            content = field1.get('col_name') || field1.get('name') || '-';
            // if(_.isString(content)) {
            //   content = Utils.prepareHeaderString(content);
            // }
            content = (
              <span>
                {field1.get('colName')}&nbsp;
                <HelpIcon id={'table_header_' + ('' + content).toLowerCase()} />
              </span>
            );
          }
        }
      }
    } else {
      if (columnIndex === 0) {
        content = '' + rowIndex;
      } else {
        content = getValue(rowIndex - 1, columnIndex - 1);
        let contentOri = content;
        if (content == null) {
          if (isScrolling) {
            content = '...';
          }
        } else {
          let field1 = this.getFieldFromIndex(columnIndex - 1);
          if (field1) {
            let isTimestamp = false;
            let fieldTypeRes = this.getFieldFromName('type');
            const indType = fieldTypeRes?.index;
            if (indType != null) {
              let typeRes = getValue(rowIndex - 1, indType);
              if (typeRes?.toUpperCase() === 'TIMESTAMP') {
                isTimestamp = true;
              }
            }

            if (['chart', 'inliers', 'outliers'].includes(field1.get('type'))) {
              isTimestamp = false;
            }

            if (isTimestamp) {
              if (['mean', 'sum', 'std_dev'].includes(field1.get('name')?.toLowerCase() || '-')) {
                content = null;
              } else if (['min', 'max'].includes(field1.get('name')?.toLowerCase() || '-')) {
                if (_.isString(content)) {
                  let contentT;
                  if (/^[0-9\\.Ee]+$/.test(content)) {
                    contentT = Utils.tryParseFloat(content);
                  }
                  if (contentT == null) {
                    //
                  } else {
                    content = contentT;
                  }
                }
                if (_.isNumber(content)) {
                  if (content > 1000000) {
                    let dt1 = moment.unix(content);
                    if (dt1.isValid()) {
                      content = <TooltipExt title={dt1.utc().format('LLL')}>{content.toFixed()}</TooltipExt>;
                    } else {
                      content = content.toFixed();
                    }
                  } else {
                    content = null;
                  }
                }
              }
            } else if (field1.get('type') === 'TIMESTAMP') {
              let dt1 = moment(content);
              if (dt1.isValid()) {
                content = dt1.format('YYYY-MM-DD HH:mm:ss');
              }
            } else if (['number', 'float'].includes(field1.get('type'))) {
              content = Utils.roundDefault(content, 2);
            } else if (field1.get('type') === 'chart') {
              if (typeof content !== 'string') {
                if (content != null) {
                  content.gridColor = 'rgba(255,255,255,0.3)';
                  content?.data?.some((d1) => {
                    if (_.isNumber(d1.y)) {
                      d1.y = Utils.decimals(d1.y, 6);
                    }
                  });
                }
                const addWordCloud = content?.addWordCloud;
                let contentChart = content;
                content =
                  !isScrolling && isVisible ? (
                    <ChartXYExt lineFilled useEC data={content} noTitles={true} height={cellHH - 2 * 4} type={'line'} colorIndex={0} startColor="#245BFF" endColor="#002BC9" {...(!content?.isBar && { colorFixed: '#245BFF' })} />
                  ) : (
                    <p
                      css={`
                        text-align: center;
                      `}
                    >
                      ...
                    </p>
                  );
                if (field1?.get('colName')?.toUpperCase() === 'Value Dist.'.toUpperCase()) {
                  let modalChart = (
                    <Provider store={Utils.globalStore()}>
                      <div css={``} className={'useDark'}>
                        <div
                          css={`
                            padding-bottom: 7px;
                            border-bottom: 1px solid white;
                          `}
                        >
                          Value Distribution
                        </div>
                        <div
                          css={`
                            margin-bottom: 10px;
                            margin-top: 10px;
                            font-size: 12px;
                            text-align: center;
                            opacity: 0.8;
                          `}
                        >
                          This data could be re-sampled
                        </div>
                        <div css={``}>
                          {!isScrolling && isVisible ? (
                            <ChartXYExt lineFilled useEC data={contentChart} noTitles={true} height={340} type={'line'} colorIndex={0} startColor="#245BFF" endColor="#002BC9" {...(!content?.isBar && { colorFixed: '#245BFF' })} />
                          ) : (
                            <p
                              css={`
                                text-align: center;
                              `}
                            >
                              ...
                            </p>
                          )}
                        </div>
                      </div>
                    </Provider>
                  );

                  let modalWordCloud = null;
                  if (addWordCloud) {
                    const words = contentChart?.data?.map((item) => ({ text: item.x, value: item.y }));
                    const options: any = {
                      enableTooltip: false,
                      deterministic: false,
                      fontFamily: 'impact',
                      fontSizes: [5, 100],
                      padding: 1,
                      rotations: 3,
                      rotationAngles: [0, 90],
                    };

                    modalWordCloud = (
                      <Provider store={Utils.globalStore()}>
                        <div css={``} className={'useDark'}>
                          <div
                            css={`
                              padding-bottom: 7px;
                              border-bottom: 1px solid white;
                            `}
                          >
                            Word Cloud
                          </div>
                          <div
                            css={`
                              height: 400px;
                            `}
                          >
                            {!isScrolling && isVisible ? (
                              <ReactWordcloud words={words} options={options} />
                            ) : (
                              <p
                                css={`
                                  text-align: center;
                                `}
                              >
                                ...
                              </p>
                            )}
                          </div>
                        </div>
                      </Provider>
                    );
                  }

                  content = (
                    <span
                      css={`
                        display: flex;
                        align-items: center;
                        width: 100%;
                        justify-content: space-between;
                        gap: 5px;
                      `}
                    >
                      <span
                        css={`
                          flex: 1;
                          display: block;
                        `}
                        onMouseEnter={() => {
                          this.setHoverItem(rowIndex, columnIndex);
                        }}
                        onMouseLeave={() => {
                          this.removeHoverItem();
                        }}
                      >
                        {content}
                      </span>
                      <span
                        css={`
                          display: flex;
                          flex-direction: column;
                          text-align: center;
                          min-width: 80px;
                        `}
                      >
                        {modalWordCloud && this.state.hoveredChart === `${rowIndex}-${columnIndex}` && (
                          <ModalConfirm
                            onClick={() => {
                              this.setHoverItem(rowIndex, columnIndex);
                            }}
                            onConfirm={() => {
                              this.removeHoverItem();
                            }}
                            onCancel={() => {
                              this.removeHoverItem();
                            }}
                            title={modalWordCloud}
                            icon={<QuestionCircleOutlined style={{ color: 'darkgreen' }} />}
                            okText={'Ok'}
                            cancelText={null}
                            okType={'primary'}
                            width={900}
                          >
                            <Button
                              css={`
                                font-size: 12px;
                                padding: 5px;
                                height: 19px;
                                line-height: 0.6;
                              `}
                              type={'primary'}
                              ghost
                              size={'small'}
                            >
                              Word Cloud
                            </Button>
                          </ModalConfirm>
                        )}
                        {this.state.hoveredChart === `${rowIndex}-${columnIndex}` && (
                          <ModalConfirm
                            onClick={() => {
                              this.setHoverItem(rowIndex, columnIndex);
                            }}
                            onConfirm={() => {
                              this.removeHoverItem();
                            }}
                            onCancel={() => {
                              this.removeHoverItem();
                            }}
                            title={modalChart}
                            icon={<QuestionCircleOutlined style={{ color: 'darkgreen' }} />}
                            okText={'Ok'}
                            cancelText={null}
                            okType={'primary'}
                            width={900}
                          >
                            <Button
                              css={`
                                font-size: 12px;
                                padding: 5px;
                                height: 19px;
                                line-height: 0.6;
                              `}
                              type={'primary'}
                              ghost
                              size={'small'}
                            >
                              Zoom
                            </Button>
                          </ModalConfirm>
                        )}
                      </span>
                    </span>
                  );
                }
              }
            } else if (field1.get('type') === 'inliers' && content.data && content.title) {
              content.data.useTitles = true;
              content.data.highlightField = 'highlight';

              const chart = (modal) =>
                !isScrolling && isVisible ? (
                  <ChartXYExt
                    verticalXAxisLabels
                    lineFilled
                    useEC
                    data={content.data}
                    noTitles={!modal}
                    height={modal ? 340 : cellHH - 2 * 4}
                    type={'bar'}
                    colorIndex={0}
                    startColor="#C08DFF"
                    endColor="#7432FB"
                    startHighlightColor="#FFC242"
                    endHighlightColor="#DB5807"
                  />
                ) : (
                  <p
                    css={`
                      text-align: center;
                    `}
                  >
                    ...
                  </p>
                );
              const modalChart = (
                <Provider store={Utils.globalStore()}>
                  <div css={``} className={'useDark'}>
                    <div
                      css={`
                        padding-bottom: 7px;
                        margin-bottom: 20px;
                        border-bottom: 1px solid white;
                      `}
                    >
                      {content.title}
                    </div>
                    {chart(true)}
                  </div>
                </Provider>
              );

              content = (
                <span
                  css={`
                    display: flex;
                    align-items: center;
                    margin-right: 10px;
                  `}
                >
                  <span
                    css={`
                      width: 140px;
                      display: block;
                    `}
                    onMouseEnter={() => {
                      this.setHoverItem(rowIndex, columnIndex);
                    }}
                    onMouseLeave={() => {
                      this.removeHoverItem();
                    }}
                  >
                    {chart(false)}
                  </span>
                  <span
                    css={`
                      margin-left: 10px;
                      width: 45px;
                    `}
                  >
                    {this.state.hoveredChart === `${rowIndex}-${columnIndex}` && (
                      <ModalConfirm
                        onClick={() => {
                          this.setHoverItem(rowIndex, columnIndex);
                        }}
                        onConfirm={() => {
                          this.removeHoverItem();
                        }}
                        onCancel={() => {
                          this.removeHoverItem();
                        }}
                        title={modalChart}
                        icon={<QuestionCircleOutlined style={{ color: 'darkgreen' }} />}
                        okText={'Ok'}
                        cancelText={null}
                        okType={'primary'}
                        width={900}
                      >
                        <Button
                          css={`
                            font-size: 12px;
                            padding: 5px;
                            height: 19px;
                            line-height: 0.6;
                          `}
                          type={'primary'}
                          ghost
                          size={'small'}
                        >
                          Zoom
                        </Button>
                      </ModalConfirm>
                    )}
                  </span>
                </span>
              );
            } else if (field1.get('type') === 'outliers' && content.data && content.title) {
              const chart = (modal) =>
                !isScrolling && isVisible ? (
                  <ChartOutliers width={modal ? 820 : 140} height={modal ? 500 : cellHH} type="box" showAxis={modal} chartData={content.data} />
                ) : (
                  <p
                    css={`
                      text-align: center;
                    `}
                  >
                    ...
                  </p>
                );
              const modalChart = (
                <div css={``} className={'useDark'}>
                  <div
                    css={`
                      padding-bottom: 7px;
                      border-bottom: 1px solid white;
                    `}
                  >
                    {content.title}
                  </div>
                  <div
                    css={`
                      display: flex;
                      flex-direction: column;
                      color: white;
                      margin-top: 10px;
                      font-size: 12px;
                      text-align: center;
                    `}
                  >
                    <div
                      css={`
                        display: flex;
                        justify-content: center;
                        gap: 15px;
                      `}
                    >
                      <span>{`Min: ${content.data.data?.min}`}</span>
                      <span>{`Lower Fence: ${content.data.data?.lowerWhisker}`}</span>
                      <span>{`Q1: ${content.data.data?.q1}`}</span>
                      <span>{`Median: ${content.data.data?.median}`}</span>
                      <span>{`Q3: ${content.data.data?.q3}`}</span>
                      <span>{`Upper Fence: ${content.data.data?.upperWhisker}`}</span>
                      <span>{`Max: ${content.data.data?.max}`}</span>
                    </div>
                    <div
                      css={`
                        display: flex;
                        flex-direction: column;
                        color: white;
                        margin-bottom: 10px;
                        font-size: 12px;
                        text-align: center;
                      `}
                    ></div>
                    <span>{`Number of Outliers: ${content.data.data?.numOutliers}`}</span>
                  </div>
                  {chart(true)}
                </div>
              );

              content = (
                <span
                  css={`
                    display: flex;
                    align-items: center;
                    margin-right: 10px;
                  `}
                >
                  <span
                    css={`
                      width: 140px;
                      display: block;
                    `}
                    onMouseEnter={() => {
                      this.setHoverItem(rowIndex, columnIndex);
                    }}
                    onMouseLeave={() => {
                      this.removeHoverItem();
                    }}
                  >
                    {chart(false)}
                  </span>
                  <span
                    css={`
                      margin-left: 10px;
                      width: 45px;
                    `}
                  >
                    {this.state.hoveredChart === `${rowIndex}-${columnIndex}` && (
                      <ModalConfirm
                        onClick={() => {
                          this.setHoverItem(rowIndex, columnIndex);
                        }}
                        onConfirm={() => {
                          this.removeHoverItem();
                        }}
                        onCancel={() => {
                          this.removeHoverItem();
                        }}
                        title={modalChart}
                        icon={<QuestionCircleOutlined style={{ color: 'darkgreen' }} />}
                        okText={'Ok'}
                        cancelText={null}
                        okType={'primary'}
                        width={900}
                      >
                        <Button
                          css={`
                            font-size: 12px;
                            padding: 5px;
                            height: 19px;
                            line-height: 0.6;
                          `}
                          type={'primary'}
                          ghost
                          size={'small'}
                        >
                          Zoom
                        </Button>
                      </ModalConfirm>
                    )}
                  </span>
                </span>
              );
            }

            const fieldName = field1?.get('name');
            if (fieldName?.toLowerCase() === 'name') {
              const findField = this.props.paramsProp?.get('findField');
              if (findField) {
                if (contentOri === findField) {
                  content = (
                    <span
                      css={`
                        background: #7a7a2e;
                        padding: 2px;
                      `}
                    >
                      {content}
                    </span>
                  );
                }
              } else if (contentOri?.startsWith('->')) {
                content = (
                  <div className={sd.linkBlue} onClick={this.onClickToNested.bind(this, content?.substring(2))}>
                    {content?.substring(2)}
                  </div>
                );
              } else {
                content = <div className={sd.ellipsis2Lines + ' ' + sd.ellipsisParent}>{content}</div>;
              }
            }
            if (fieldName?.toLowerCase() === 'data_type') {
              if (contentOri?.startsWith('->')) {
                content = (
                  <div className={sd.linkBlue} onClick={this.onClickToNested.bind(this, content?.substring(2))}>
                    {'(Nested Feature > View)'}
                  </div>
                );
              }
            }
            if (fieldName?.toLowerCase() === 'approx_distinct_vals') {
              let dataType = getValue(rowIndex - 1, 1);
              if (['email', 'multivaluecategorical', 'categorical'].includes(dataType?.toLowerCase())) {
                let contentChart = getValue(rowIndex - 1, 2);
                if (contentChart?.data != null && _.isArray(contentChart?.data) && contentChart?.data?.length > 0) {
                  content = (
                    <span
                      css={`
                        text-align: center;
                      `}
                    >
                      <span>{content}</span>
                      <span
                        css={`
                          margin-left: 10px;
                        `}
                      >
                        <Button
                          onClick={this.onClickViewValues.bind(this, contentChart)}
                          css={`
                            font-size: 12px;
                            padding: 5px;
                            height: 19px;
                            line-height: 0.6;
                          `}
                          type={'primary'}
                          ghost
                          size={'small'}
                        >
                          View
                        </Button>
                      </span>
                    </span>
                  );
                }
              }
            }
          }

          if (field1?.get('name')?.toLowerCase() === 'name' && this.state.selectedColumnsText) {
            content = UtilsTS.highlightIsTextInside(content, this.state.selectedColumnsText);
          }
        }
      }
    }

    let styleF = _.assign({}, style || {});
    styleF.backgroundColor = rowIndex === 0 ? Constants.backBlueDark() : Utils.isDark() ? '#0E141C' : '#f5f5f5';
    if (rowIndex > 0) {
      if (rowIndex % 2 === 1) {
        styleF.backgroundColor = '#19232f';
      } else {
        styleF.backgroundColor = '#0c121b';
      }
    }

    return (
      <div key={key} style={styleF} className={s.Cell}>
        {content}
      </div>
    );
  };

  getFieldFromIndex = (index) => {
    let dataset1 = this.memFGSchema(false)(this.props.featureGroups, this.calcFeatureGroupVersion());
    const nestedFeature = this.calcNestedFeature();
    if (nestedFeature) {
      dataset1 = this.getNestedFeatureSchema(dataset1, nestedFeature);
    }

    if (dataset1) {
      let fieldsList = dataset1.get('fields');
      if (fieldsList) {
        let field1 = fieldsList.get(index);
        if (field1) {
          return field1;
        }
      }
    }
  };

  getFieldFromName: (name: string) => { field; index } = (name) => {
    if (!name) {
      return null;
    }

    let dataset1 = this.memFGSchema(false)(this.props.featureGroups, this.calcFeatureGroupVersion());
    const nestedFeature = this.calcNestedFeature();
    if (nestedFeature) {
      dataset1 = this.getNestedFeatureSchema(dataset1, nestedFeature);
    }
    if (dataset1) {
      let fieldsList = dataset1.get('fields');
      if (fieldsList) {
        let ind = fieldsList.findIndex((f1) => f1.get('name')?.toLowerCase() === name?.toLowerCase());
        if (ind > -1) {
          return { field: fieldsList.get(ind), index: ind };
        }
      }
    }
  };

  gridColumnWidth = ({ index }) => {
    if (index === 0) {
      return 80;
    }

    let field1 = this.getFieldFromIndex(index - 1);
    if (field1) {
      if (field1.get('colName') === 'Value Dist.' || field1.get('colName') === 'Inliers' || field1.get('colName') === 'Outliers') {
        return 200;
      }

      let type1 = field1.get('type');
      // console.log('type1', type1)

      if (type1 === 'array') {
        return 200;
      } else if (type1 === 'string') {
        return 240;
      } else if (type1 === 'number') {
        return 160;
      } else if (type1 === 'timestamp') {
        return 200;
      } else {
        return 130;
      }
    }

    return 100;
  };

  memCacheSize = memoizeOne((featureGroupId, featureGroupVersion, rowsCount, columnsCount, selectedColumns, selectedColumnsText, selectedColumnsNonIgnored) => {
    if (rowsCount > 0 && columnsCount > 0) {
      this.alreadyHasData = null;
      this.cacheGrid.setSize(rowsCount, columnsCount);
      setTimeout(() => {
        // @ts-ignore
        this.refs.sizer && this.refs.sizer.refs.gridRef && this.refs.sizer.refs.gridRef.forceUpdateGrids();
        // @ts-ignore
        this.refs.sizer && this.refs.sizer.refs.gridRef && this.refs.sizer.refs.gridRef.recomputeGridSize();

        if (this.lastRangeGridRender) {
          this.gridOnSectionRendered(this.lastRangeGridRender);
        }

        this.setState(
          {
            scrollToRow: 1,
          },
          () => {
            this.setState({
              scrollToRow: undefined,
            });
          },
        );
      }, 0);
    }
  });

  memFGSchema = memoizeOneCurry((doCall, featureGroupsParam, featureGroupVersion) => {
    return featureGroups.memAnalyzeSchemaFeatureGroupByVersion(doCall, featureGroupVersion);
  });

  memFGOptions = memoizeOne((listFGs) => {
    let optionsDatasets = listFGs?.map((f1) => ({ label: f1?.tableName ?? f1?.name, value: f1?.featureGroupId, name: f1?.tableName ?? f1?.name }));
    optionsDatasets &&
      optionsDatasets?.sort((a, b) => {
        return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
      });

    return optionsDatasets ?? [];
  });

  onChangeSelectURLDirectFromValueFGVersion = (option1) => {
    if (!option1) {
      return;
    }

    let { paramsProp } = this.props;
    this.setState({
      isApproximateCount: null,
      approximateCountsMessage: null,
    });

    let mode = paramsProp && paramsProp.get('mode');
    if (!Utils.isNullOrEmpty(mode)) {
      let p1 = this.calcProjectId();
      if (p1) {
        p1 = '/' + p1;
      } else {
        p1 = '';
      }
      if (this.props.paramsProp?.get('projectId') === '-') {
        p1 = '/-';
      }

      let param1 = 'featureGroupVersion=' + encodeURIComponent(option1?.value ?? '');

      let f1 = paramsProp && paramsProp.get('featureGroupId');
      Location.push('/' + mode + p1 + '/' + f1, undefined, param1);
    }
  };

  onChangeSelectURLDirectFromValue = (optionSel) => {
    if (!optionSel) {
      return;
    }

    let { paramsProp } = this.props;
    this.setState({
      isApproximateCount: null,
      approximateCountsMessage: null,
    });

    let mode = paramsProp && paramsProp.get('mode');
    if (!Utils.isNullOrEmpty(mode)) {
      let p1 = this.calcProjectId();
      if (p1) {
        p1 = '/' + p1;
      } else {
        p1 = '';
      }

      if (mode === PartsLink.feature_groups_data_explorer) {
        if (this.props.paramsProp?.get('projectId') === '-') {
          p1 = '/-';
        }

        Location.push('/' + mode + p1 + '/' + optionSel.value);
      } else {
        Location.push('/' + mode + '/' + optionSel.value + p1);
      }
    }
  };

  memFeatureGroupVersion = memoizeOneCurry((doCall, featureGroupParam, featureGroupId, featureGroupVersion) => {
    if (featureGroupParam && !Utils.isNullOrEmpty(featureGroupVersion) && featureGroupId) {
      let res = featureGroups.memFeatureGroupsVersionsForFeatureGroupId(doCall, featureGroupId);
      return res?.find((v1) => v1?.featureGroupVersion === featureGroupVersion);
    }
  });

  memFeatureGroup = memoizeOneCurry((doCall, featureGroupParam, projectId, featureGroupId) => {
    if (featureGroupParam && !Utils.isNullOrEmpty(featureGroupId)) {
      return featureGroups.memFeatureGroupsForId(doCall, projectId, featureGroupId);
    }
  });

  memProjectFG = memoizeOneCurry((doCall, featureGroupsParam, projectId) => {
    return featureGroups.memFeatureGroupsForProjectId(doCall, projectId);
  });

  memRowsColumnsCount: (foundProject1, featureGroupOne, batchPredId, featureGroupId, modelVersion, fgSchema1) => { columnsCount; rowsCount; rowCountForTable } = memoizeOne(
    (foundProject1, featureGroupOne, batchPredId, featureGroupId, modelVersion, fgSchema1) => {
      let datasetSchema1 = featureGroupOne?.projectFeatureGroupSchema;

      let rowsCount = 0,
        rowCountForTable = 0;
      let columnsCount = 0;
      if (datasetSchema1 || fgSchema1) {
        let fieldsList = datasetSchema1?.schema;
        if (fieldsList) {
          columnsCount = fieldsList.length;
        }

        let row_count = datasetSchema1?.count;

        let fieldsListColsCount = fgSchema1?.get('rowCount') ?? fgSchema1?.get('row_count');
        if (fieldsListColsCount != null) {
          columnsCount = fieldsListColsCount;
        }

        if (fgSchema1 && row_count == null) {
          let row_count2 = fgSchema1.get('count');
          if (row_count2 != null) {
            row_count = row_count2;
          }
        }

        if (row_count != null) {
          rowsCount = row_count + 1;
          rowCountForTable = rowsCount;
        }
      }
      return { columnsCount, rowsCount, rowCountForTable };
    },
  );

  calcFeatureGroupVersion = () => {
    let featureGroupId = this.calcFeatureGroupId();
    let featureGroupVersion = this.props.paramsProp?.get('featureGroupVersion');
    if (featureGroupVersion) {
      return featureGroupVersion;
    }
    let featuresGroupsVersionsList = this.memFGVersions(false)(this.props.featureGroups, featureGroupId);
    featureGroupVersion = null;
    if (featuresGroupsVersionsList != null) {
      featureGroupVersion = featuresGroupsVersionsList?.[0]?.featureGroupVersion;
    }
    return featureGroupVersion;
  };

  calcNestedFeature = () => {
    return this.props.paramsProp?.get('nested');
  };

  getNestedFeatureSchema = (fgSchema, feature) => {
    const nestedSchema = fgSchema?.get('nested_schema');
    const nestedFeatureSchema = nestedSchema?.get(feature);

    return nestedFeatureSchema;
  };

  memDatasetsOne = memoizeOneCurry((doCall, datasets, id1) => {
    if (id1) {
      let res = datasetsReq.memDatasetListCall(doCall, datasets, [id1]);
      if (res != null) {
        res = Object.values(res)?.[0];
      }
      return res;
    }
  });

  memListColumns = memoizeOne((featureGroupOne) => {
    let res = featureGroupOne?.features?.map((f1) => f1.name);
    if (res != null) {
      return res;
    }
    return featureGroupOne?.projectFeatureGroupSchema?.schema?.map((f1) => f1.name);
  });

  render() {
    let { datasets, paramsProp, featureGroups } = this.props;
    const fetchGroupAnalyzeStatus = featureGroups.get('fetchGroupAnalyzeStatus');
    let featureGroupVersion = this.calcFeatureGroupVersion();
    let projectId = this.calcProjectId();
    let featureGroupId = paramsProp && paramsProp.get('featureGroupId');
    let batchPredId = paramsProp && paramsProp.get('batchPredId');
    let modelVersion = paramsProp && paramsProp.get('modelVersion');

    if (!featureGroupId) {
      return <div></div>;
    }

    let featureGroupOne = this.memFeatureGroup(false)(this.props.featureGroups, projectId, featureGroupId);
    if (featureGroupOne == null || _.isEmpty(featureGroupOne)) {
      return <div></div>;
    }

    let errorNeedVersion = false;
    let featureGroupVersionOne = this.memFeatureGroupVersion(false)(this.props.featureGroups, featureGroupId, featureGroupVersion);
    if (featureGroupVersionOne == null || _.isEmpty(featureGroupVersionOne)) {
      errorNeedVersion = true;
    }

    let msgError = null;
    let fgLifecycle = featureGroupVersionOne?.status;
    if (!errorNeedVersion) {
      if ([FeatureGroupVersionLifecycle.COMPLETE].includes(fgLifecycle)) {
        //
      } else if ([FeatureGroupVersionLifecycle.FAILED, FeatureGroupVersionLifecycle.CANCELLED].includes(fgLifecycle)) {
        msgError = <RefreshAndProgress errorMsg={'Feature Group ' + Utils.upperFirst(fgLifecycle)}></RefreshAndProgress>;
      } else {
        msgError = <RefreshAndProgress isMsgAnimRefresh={true} msgMsg={'Feature Group is processing'}></RefreshAndProgress>;
      }
    }

    let isRefreshing = false;

    let popupContainerForMenu = (node) => document.getElementById('body2');

    let fgSchema1 = errorNeedVersion ? null : this.memFGSchema(false)(this.props.featureGroups, featureGroupVersion);

    //
    const topHH = 95 + 56;

    let columnsListFilter = this.memListColumns(featureGroupOne);

    const nestedFeature = this.calcNestedFeature();
    const nestedSchema = fgSchema1?.get('nested_schema')?.toJS();
    let nestedFeatureSchema = this.getNestedFeatureSchema(fgSchema1, nestedFeature);

    let rowsCount = 0;
    let columnsCount = 0;
    let numDuplicateRows;
    if (fgSchema1) {
      if (nestedFeature && nestedFeatureSchema) {
        let fieldsList = nestedFeatureSchema.get('fields');
        if (fieldsList) {
          columnsCount = fieldsList.size;
        }

        let row_count = nestedFeatureSchema.get('rowCount') ?? nestedFeatureSchema.get('row_count');
        if (row_count != null) {
          rowsCount = row_count + 1;
        }

        numDuplicateRows = nestedFeatureSchema?.get('num_duplicate_rows') ?? nestedFeatureSchema?.get('numDuplicateRows');
      } else {
        let fieldsList = fgSchema1.get('fields');
        if (fieldsList) {
          columnsCount = fieldsList.size;
        }

        let row_count = fgSchema1.get('rowCount') ?? fgSchema1.get('row_count');
        if (row_count != null) {
          rowsCount = row_count + 1;
        }

        numDuplicateRows = fgSchema1?.get('num_duplicate_rows') ?? fgSchema1?.get('numDuplicateRows');

        if (nestedSchema) {
          for (const [key, value] of Object.entries(nestedSchema)) {
            if (typeof value === 'object') {
              rowsCount++;
            }
          }
        }
      }
    }

    if (!errorNeedVersion) {
      this.memCacheSize(featureGroupId, featureGroupVersion, rowsCount, columnsCount, this.state.selectedColumns, this.state.selectedColumnsText, this.state.selectedColumnsNonIgnored);
    }

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
      textTransform: 'uppercase',
      borderBottom: '1px solid ' + borderAAA,
      fontWeight: 'bold',
      backgroundColor: Constants.backBlueDark(),
    };
    const STYLE_BOTTOM_RIGHT_GRID = {
      outline: 'none',
    };

    let optionsFGSel = null;
    let optionsFG = [];
    if (datasets) {
      let listFGs = this.memProjectFG(false)(this.props.featureGroups, projectId);
      optionsFG = this.memFGOptions(listFGs);
      if (optionsFG && featureGroupId) {
        optionsFGSel = optionsFG.find((p1) => p1.value === featureGroupId);
      }
    }
    if (projectId == null) {
      optionsFGSel = { label: featureGroupOne?.name, value: null };
    }

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    //
    // let datasetSchema1 = null;
    // if(foundProject1) {
    //   datasetSchema1 = this.memDatasetSchema(false)(this.props.defDatasets, projectId, datasetId, batchPredId, modelVersion, false);
    // }

    let rowsCountRaw: number = null;
    let columnsCountRaw = 0;
    const sizeRes = this.memRowsColumnsCount(foundProject1, featureGroupOne, batchPredId, featureGroupId, modelVersion, nestedFeature ? nestedFeatureSchema : fgSchema1);
    if (sizeRes != null) {
      columnsCountRaw = sizeRes?.columnsCount ?? 0;
      rowsCountRaw = sizeRes?.rowsCount ?? 0;
    }
    const numberOfRows = rowsCountRaw != null ? (rowsCountRaw > 0 ? rowsCountRaw - 1 : 0) : null;

    let gridData = null;
    if (!msgError && !errorNeedVersion) {
      gridData = (width, height) => (
        <MultiGrid
          ref={'gridRef'}
          cellRenderer={this.cellRenderer}
          onSectionRendered={this.gridOnSectionRendered}
          scrollToRow={this.state.scrollToRow}
          scrollToColumn={this.state.scrollToColumn}
          className={s.gridAfter}
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
          fixedColumnCount={2}
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
          height={height - topHH}
          rowCount={rowsCount}
          rowHeight={cellHH}
          width={width - 2 * 30}
        />
      );
    }

    let featuresGroupsVersionsList = this.memFGVersions(false)(this.props.featureGroups, featureGroupId);
    let optionsFgVersion = this.memFGVersonsOptions(featuresGroupsVersionsList);
    let fgVersionSelectValue = optionsFgVersion?.find((d1) => d1?.value == featureGroupVersion);

    let showNeedSnapshotMsgOnClick = null;
    let showNeedSnapshotMsgTitle = null;
    let showNeedSnapshotMsg = null;
    let showNeedSnapshot = false;
    let showNumOfRowsAndColumns = true;
    if (errorNeedVersion && !Utils.isNullOrEmpty(featureGroupId) && (optionsFgVersion?.length ?? 0) === 0) {
      if (Utils.isNullOrEmpty(featureGroupVersion)) {
        showNumOfRowsAndColumns = false;
        showNeedSnapshot = true;
        showNeedSnapshotMsgTitle = 'To see data exploration';
        showNeedSnapshotMsg = 'Materialize Latest Version';
        showNeedSnapshotMsgOnClick = () => {
          REClient_.client_().createFeatureGroupSnapshot(projectId, featureGroupId, (err, res) => {
            if (err || !res?.success) {
              REActions.addNotificationError(err || Constants.errorDefault);
            } else {
              StoreActions.featureGroupsVersionsList_(featureGroupId);
              Location.push('/' + PartsLink.feature_group_detail + '/' + (projectId ?? '-') + '/' + featureGroupId);
            }
          });
        };
      }
    }

    if (fgVersionSelectValue?.data?.status != null) {
      if (fgVersionSelectValue?.data?.status?.toUpperCase() !== FeatureGroupVersionLifecycle.COMPLETE.toUpperCase()) {
        StoreActions.refreshDoFGVersionsAll_(projectId, featureGroupId, featureGroupVersion);

        let lastV1 = null;
        if (optionsFgVersion != null && optionsFgVersion.length > 0) {
          let ind1 = optionsFgVersion?.findIndex((v1) => [FeatureGroupVersionLifecycle.COMPLETE].includes(v1.data?.status ?? '-'));
          if (ind1 > -1) {
            lastV1 = optionsFgVersion?.[ind1]?.data?.featureGroupVersion;
          }
        }
        if (!Utils.isNullOrEmpty(lastV1)) {
          msgError = null;
          showNeedSnapshot = true;
          if ([FeatureGroupVersionLifecycle.FAILED.toUpperCase(), FeatureGroupVersionLifecycle.CANCELLED.toUpperCase()].includes(fgVersionSelectValue?.data?.status?.toUpperCase() ?? '-')) {
            showNeedSnapshotMsgTitle = Utils.upperFirst(fgVersionSelectValue?.data?.status ?? '');
          } else {
            showNeedSnapshotMsgTitle = 'Processing...';
          }
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

              Location.push('/' + mode + (p1 || '/-') + '/' + paramsProp?.get('featureGroupId'), undefined, featureGroupVersion);
            }
          };
        }
      }
    }

    let showProcessing;
    if (fgVersionSelectValue?.value == null) {
      let datasetOne = this.memDatasetsOne(false)(this.props.datasets, featureGroupOne?.datasetId);
      if (datasetOne == null) {
        //
      } else {
        let datasetLifecycle = (datasetOne as any)?.get('status');
        if ([DatasetLifecycle.COMPLETE].includes(datasetLifecycle)) {
          //
        } else if ([DatasetLifecycle.CANCELLED, DatasetLifecycle.IMPORTING_FAILED, DatasetLifecycle.INSPECTING_FAILED, DatasetLifecycle.FAILED].includes(datasetLifecycle)) {
          showProcessing = <RefreshAndProgress errorMsg={'Dataset ' + DatasetLifecycleDesc[datasetLifecycle]}></RefreshAndProgress>;
        } else {
          if ([DatasetLifecycle.INSPECTING, DatasetLifecycle.IMPORTING, DatasetLifecycle.UPLOADING, DatasetLifecycle.CONVERTING].includes(datasetLifecycle)) {
            StoreActions.refreshDoDatasetAll_(featureGroupOne?.datasetId, projectId);
          }
          showProcessing = <RefreshAndProgress isMsgAnimRefresh={true} msgMsg={'Dataset is processing'}></RefreshAndProgress>;
        }
      }
    }
    if (showProcessing != null) {
      msgError = 'Processing';
    }

    const topHHFilter = nestedFeature ? 0 : 45;

    let isApproximateCount = this.state.isApproximateCount === true;
    let approximateCountsMessage = this.state.approximateCountsMessage == null ? 'For this feature group, the value distribution is approximate' : this.state.approximateCountsMessage;

    return (
      <div style={{ margin: '0 25px', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <RefreshAndProgress isRefreshing={isRefreshing}>
          <AutoSizer ref={'sizer'}>
            {({ width, height }) => (
              <div style={{ height: height + 'px', width: width + 'px' }}>
                {isRefreshing === true && (
                  <div style={{ textAlign: 'center', margin: '40px auto', fontSize: '12px', color: Utils.colorA(0.7) }}>
                    <FontAwesomeIcon icon={'sync'} transform={{ size: 15 }} spin style={{ marginRight: '8px', opacity: 0.8 }} />
                    Retrieving Project Details...
                  </div>
                )}

                {isRefreshing !== true && (
                  <div style={{ padding: '25px 30px', position: 'relative' }}>
                    <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH + topHHFilter }}>
                      {!nestedFeature && (
                        <div
                          style={{ flex: '0', whiteSpace: 'nowrap', fontWeight: 400 }}
                          css={`
                            align-items: center;
                            display: flex;
                          `}
                        >
                          <span>
                            Data Exploration&nbsp;&nbsp;
                            <HelpIcon id={'fg_dataexplorer_title'} style={{ marginLeft: '4px' }} />
                          </span>
                          <span style={{ verticalAlign: 'top', paddingTop: '2px', marginLeft: '16px', width: '280px', display: 'inline-block', fontSize: '12px' }}>
                            <SelectExt isDisabled={!!batchPredId || !projectId} value={optionsFGSel} options={optionsFG} onChange={this.onChangeSelectURLDirectFromValue} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
                          </span>

                          {!batchPredId && (
                            <span
                              css={`
                                & .textVersion {
                                  display: inline-block;
                                }
                                width: 200px;
                                @media (max-width: 1540px) {
                                  & .textVersion {
                                    display: none;
                                  }
                                }
                                @media (min-width: 1540px) {
                                  width: 330px;
                                }
                              `}
                              style={{ verticalAlign: 'top', paddingTop: '2px', marginLeft: '16px', display: 'inline-block', fontSize: '12px' }}
                            >
                              <SelectExt value={fgVersionSelectValue} options={optionsFgVersion ?? []} onChange={this.onChangeSelectURLDirectFromValueFGVersion} menuPortalTarget={popupContainerForMenu(null)} />
                            </span>
                          )}

                          {msgError == null && showNumOfRowsAndColumns && (
                            <span
                              style={{ marginLeft: '20px', marginRight: '20px' }}
                              className={classNames(s.tagItem, numberOfRows && numberOfRows < 1 ? s.errorItem : null)}
                              css={`
                                display: inline-block;
                              `}
                            >
                              <span>
                                <span
                                  css={`
                                    @media screen and (max-width: 1400px) {
                                      display: none;
                                    }
                                  `}
                                >
                                  Number of{' '}
                                </span>
                                Rows: <b>{fetchGroupAnalyzeStatus === FetchStateEnum.COMPLETED ? <NumberPretty>{numberOfRows ?? 0}</NumberPretty> : null}</b>
                                {numDuplicateRows != null ? (
                                  <span>
                                    <br />
                                    <TooltipExt title={'Number of Duplicated Rows'}>
                                      Dup
                                      <span
                                        css={`
                                          @media screen and (max-width: 1400px) {
                                            display: none;
                                          }
                                        `}
                                      >
                                        licated
                                      </span>{' '}
                                      Rows
                                    </TooltipExt>
                                    :{' '}
                                    <b>
                                      <NumberPretty>{numDuplicateRows}</NumberPretty>
                                    </b>
                                  </span>
                                ) : null}
                              </span>
                            </span>
                          )}
                          {msgError == null && showNumOfRowsAndColumns && (
                            <span className={s.tagItem}>
                              <span
                                css={`
                                  @media screen and (max-width: 1400px) {
                                    display: none;
                                  }
                                `}
                              >
                                Number of{' '}
                              </span>
                              Columns: <b>{columnsCountRaw}</b>
                            </span>
                          )}
                        </div>
                      )}

                      <div
                        css={`
                          display: flex;
                          margin-top: 20px;
                          font-size: 14px;
                        `}
                      >
                        {nestedFeature && (
                          <div
                            css={`
                              font-size: 14px;
                              display: flex;
                              align-items: center;
                              margin-right: 20px;
                            `}
                          >
                            <TooltipExt title={'Go Back'}>
                              <span
                                css={`
                                  margin-right: 8px;
                                  cursor: pointer;
                                  opacity: 0.7;
                                `}
                                onClick={this.onClickFromNested.bind(this)}
                              >
                                <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faArrowAltSquareLeft').faArrowAltSquareLeft} transform={{ size: 15, x: 0, y: 0 }} />
                              </span>
                              <span
                                css={`
                                  white-space: nowrap;
                                  margin-right: 5px;
                                  cursor: pointer;
                                `}
                                onClick={this.onClickFromNested.bind(this)}
                              >
                                Nested:
                              </span>
                            </TooltipExt>
                            <span>
                              <b>{nestedFeature}</b>
                            </span>
                          </div>
                        )}
                        <FilterByColumns hideNonIgnoredColumns={projectId == null} countIncludeAll onChange={this.onChangeSelectedColumns} columnsList={columnsListFilter} hideCount={true} />
                        {nestedFeature && (
                          <div
                            css={`
                              font-size: 14px;
                              display: flex;
                              align-items: center;
                              margin-left: 10px;
                            `}
                          >
                            {msgError == null && (
                              <span
                                style={{ marginLeft: '20px', marginRight: '20px' }}
                                className={s.tagItem}
                                css={`
                                  display: inline-block;
                                `}
                              >
                                <span>
                                  <span
                                    css={`
                                      @media screen and (max-width: 1400px) {
                                        display: none;
                                      }
                                    `}
                                  >
                                    Number of{' '}
                                  </span>
                                  Rows:{' '}
                                  <b>
                                    <NumberPretty>{numberOfRows}</NumberPretty>
                                  </b>
                                  {numDuplicateRows != null ? (
                                    <span>
                                      <br />
                                      <TooltipExt title={'Number of Duplicated Rows'}>
                                        Dup
                                        <span
                                          css={`
                                            @media screen and (max-width: 1400px) {
                                              display: none;
                                            }
                                          `}
                                        >
                                          licated
                                        </span>{' '}
                                        Rows
                                      </TooltipExt>
                                      :{' '}
                                      <b>
                                        <NumberPretty>{numDuplicateRows}</NumberPretty>
                                      </b>
                                    </span>
                                  ) : null}
                                </span>
                              </span>
                            )}
                            {msgError == null && (
                              <span className={s.tagItem}>
                                <span
                                  css={`
                                    @media screen and (max-width: 1400px) {
                                      display: none;
                                    }
                                  `}
                                >
                                  Number of{' '}
                                </span>
                                Columns: <b>{columnsCountRaw}</b>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={sd.table} style={{ position: 'relative', textAlign: 'left', borderTop: '1px solid ' + Constants.lineColor(), height: height - topAfterHeaderHH - topHHFilter - 70 + 'px' }}>
                      {showProcessing == null && (
                        <RefreshAndProgress msgTop={showNeedSnapshotMsgTitle ? '10%' : null} msgMsg={showNeedSnapshotMsgTitle} msgButtonText={showNeedSnapshotMsg} onClickMsgButton={showNeedSnapshotMsgOnClick}>
                          {!showNeedSnapshot && msgError}
                          {isApproximateCount && (
                            <div
                              css={`
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                padding: 8px;
                              `}
                            >
                              <span
                                css={`
                                  padding: 5px 10px;
                                  border-radius: 6px;
                                  font-size: 12px;
                                  margin-bottom: 4px;
                                  border: 1px solid rgba(255, 255, 0, 0.39);
                                  background: rgba(255, 255, 0, 0.22);
                                `}
                              >
                                {approximateCountsMessage}
                              </span>
                            </div>
                          )}
                          {!showNeedSnapshot ? (
                            (!this.state.isGridRenderInitialized || this.state.showGrid) && !this.state.isDataFetchError ? (
                              gridData?.(width, height - (this.state.isApproximateCount ? 50 : 0))
                            ) : this.state.isDataFetchError ? (
                              <RefreshAndProgress errorMsg={this.state.dataFetchErrorMsg} />
                            ) : (
                              <RefreshAndProgress msgMsg={Constants.no_data} />
                            )
                          ) : null}
                        </RefreshAndProgress>
                      )}
                      {showProcessing}
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
  (state: RootState) => ({
    paramsProp: state.paramsProp,
    projects: state.projects,
    defDatasets: state.defDatasets,
    datasets: state.datasets,
    projectDatasets: state.projectDatasets,
    featureGroups: state.featureGroups,
  }),
  null,
)(FeatureGroupsDataExplorerOne);
