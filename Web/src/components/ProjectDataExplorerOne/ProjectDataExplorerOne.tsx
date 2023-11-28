import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Modal from 'antd/lib/modal';
import * as Immutable from 'immutable';
import $ from 'jquery';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { connect, Provider } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import MultiGrid from 'react-virtualized/dist/commonjs/MultiGrid';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import { GridCacheMem } from '../../api/GridCacheMem';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import { calcDatasetById, DatasetLifecycle, DatasetLifecycleDesc, default as datasets, default as datasetsReq } from '../../stores/reducers/datasets';
import { calcAnalyzeSchemaDatasetById, calcFileDataUseByDatasetIdProjectId, calcFileSchemaByDatasetId } from '../../stores/reducers/defDatasets';
import projectDatasetsReq from '../../stores/reducers/projectDatasets';
import { memProjectById } from '../../stores/reducers/projects';
import UtilsTS from '../../UtilsTS';
import ChartOutliers from '../ChartOutliers/ChartOutliers';
import ChartXYExt from '../ChartXYExt/ChartXYExt';
import DateOld from '../DateOld/DateOld';
import FilterByColumns from '../FilterByColumns/FilterByColumns';
import HelpIcon from '../HelpIcon/HelpIcon';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import NumberPretty from '../NumberPretty/NumberPretty';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';

const { confirm } = Modal;

const s = require('./ProjectDataExplorerOne.module.css');
const sd = require('../antdUseDark.module.css');

const topAfterHeaderHH = 80;
const cellHH = 54;

interface IProjectDataExplorerOneProps {
  paramsProp?: any;
  projects?: any;
  projectDatasets?: any;
  defDatasets?: any;
  datasets?: any;
  onChangeProject?: (key: any) => void;
}

interface IProjectDataExplorerOneState {
  scrollToRow?: number;
  scrollTopGrid?: any;
  chartsUuid?: string;
  hoveredChart?: string;

  selectedColumns?: any;
  selectedColumnsNonIgnored?: any;
  selectedColumnsText?: any;
}

class ProjectDataExplorerOne extends React.PureComponent<IProjectDataExplorerOneProps, IProjectDataExplorerOneState> {
  private unDark: any;
  cacheGrid = new GridCacheMem();
  private timeoutCallRangeRender: any;
  // private gridRef: any;
  private lastRangeGridRender: { columnOverscanStartIndex: any; columnOverscanStopIndex: any; rowOverscanStopIndex: any; columnStopIndex: any; rowStartIndex: any; columnStartIndex: any; rowStopIndex: any; rowOverscanStartIndex: any };
  private isM: boolean;
  private confirmValues: any;
  private hoverTimeoutId: any;

  constructor(props) {
    super(props);

    this.state = {
      chartsUuid: null,
      hoveredChart: null,
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

    let datasetId = this.props.paramsProp?.get('datasetId');
    let projectId = this.calcProjectId();
    let batchPredId = this.props.paramsProp?.get('batchPredId');
    let modelVersion = this.props.paramsProp?.get('modelVersion');
    let datasetVersion = this.props.paramsProp?.get('datasetVersion');

    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);

    let listDatasetsProj = this.memProjectDatasets(true)(this.props.projectDatasets, projectId);
    let listDatasets = this.memDatasetsList(true)(this.props.datasets, listDatasetsProj, datasetId);

    let datasetOne = this.memDatasetOne(this.props.datasets, datasetId);
    let dataset1 = this.memDataset(true)(this.props.defDatasets, projectId, datasetId, batchPredId, modelVersion, datasetVersion);

    let datasetSchema1 = this.memDatasetSchema(true)(this.props.defDatasets, projectId, datasetId, batchPredId, modelVersion, true);

    let fgVersionsList = this.memDatasetVersions(true)(this.props.datasets, datasetId);
  };

  componentDidUpdate(prevProps: Readonly<IProjectDataExplorerOneProps>, prevState: Readonly<IProjectDataExplorerOneState>, snapshot?: any): void {
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
    if (Utils.isNullOrEmpty(res)) {
      res = null;
    }
    return res;
  };

  calcModelVersion = () => {
    return this.props.paramsProp?.get('modelVersion');
  };

  cacheHasNewData = () => {
    this.forceUpdate();
  };

  cacheOnNeedCache = async (fromRow: number, toRow: number, fromCol: number, toCol: number): Promise<any> => {
    return new Promise((resolve, reject) => {
      let method1 = 'get_dataset_metrics';
      if (this.calcDatasetVersion()) {
        method1 = 'get_dataset_metrics_version';
      }

      REClient_.client_()[method1](
        this.calcProjectId(),
        this.calcDatasetId(),
        this.calcBatchPredId(),
        this.calcDatasetVersion() || this.calcModelVersion(),
        fromRow,
        toRow,
        fromCol,
        toCol,
        this.state.selectedColumns,
        this.state.selectedColumnsNonIgnored,
        (err, res) => {
          if (err) {
            Utils.error('Error: ' + err);
          }

          if (!err && res && res.result && res.result.data) {
            resolve(res.result.data);
          } else {
            resolve(null);
          }
        },
      );
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
    isVisible, // This cell is visible within the grid (eg it is not an overscanned cell)
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
              if (content != null) {
                content.gridColor = 'rgba(255,255,255,0.3)';
                content?.data?.some((d1) => {
                  if (_.isNumber(d1.y)) {
                    d1.y = Utils.decimals(d1.y, 6);
                  }
                });
              }
              let contentChart = content;
              content = (
                <ChartXYExt wait={1000} lineFilled useEC data={content} noTitles={true} height={cellHH - 2 * 4} type={'line'} colorIndex={0} startColor="#245BFF" endColor="#002BC9" {...(!content?.isBar && { colorFixed: '#245BFF' })} />
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
                        <ChartXYExt wait={1000} lineFilled useEC data={contentChart} noTitles={true} height={340} type={'line'} colorIndex={0} startColor="#245BFF" endColor="#002BC9" {...(!content?.isBar && { colorFixed: '#245BFF' })} />
                      </div>
                    </div>
                  </Provider>
                );
                content = (
                  <span
                    css={`
                      display: flex;
                      align-items: center;
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
                      {content}
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
            } else if (field1.get('type') === 'inliers' && content.data && content.title) {
              content.data.useTitles = true;
              content.data.highlightField = 'highlight';

              const chart = (modal) => (
                <ChartXYExt
                  wait={1000}
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
              const chart = (modal) => <ChartOutliers width={modal ? 820 : 140} height={modal ? 500 : cellHH} type="box" showAxis={modal} chartData={content.data} />;
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
    let dataset1 = this.memDataset(false)(this.props.defDatasets, this.calcProjectId(), this.calcDatasetId(), this.calcBatchPredId(), this.calcModelVersion(), this.calcDatasetVersion());
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

    let dataset1 = this.memDataset(false)(this.props.defDatasets, this.calcProjectId(), this.calcDatasetId(), this.calcBatchPredId(), this.calcModelVersion(), this.calcDatasetVersion());
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

      if (type1 === 'array') {
        return 200;
      } else if (type1 === 'string') {
        return 240;
      } else if (type1 === 'number') {
        return 160;
      } else if (type1 === 'timestamp') {
        return 200;
      } else {
        return 120;
      }
    }

    return 100;
  };

  memCacheSize = memoizeOne((datasetId, rowsCount, columnsCount, selectedColumns, selectedColumnsText, selectedColumnsNonIgnored) => {
    if (rowsCount > 0 && columnsCount > 0) {
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

  memDataset = memoizeOneCurry((doCall, defDatasets, projectId, datasetId, batchPredId, modelVersion, datasetVersion) => {
    if ((Utils.isNullOrEmpty(projectId) && !Utils.isNullOrEmpty(batchPredId)) || Utils.isNullOrEmpty(datasetId)) {
      return null;
    }

    let ds1 = calcAnalyzeSchemaDatasetById(undefined, projectId, datasetId, batchPredId, modelVersion, datasetVersion);
    if (ds1 == null && defDatasets && !defDatasets.get('isRefreshing')) {
      if (doCall) {
        StoreActions.analyzeSchemaByDatasetId_(projectId, datasetId, batchPredId, modelVersion, datasetVersion, null);
      }
    }
    return ds1;
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

  onChangeSelectURLDirectFromValue = (optionSel) => {
    if (!optionSel) {
      return;
    }

    let { paramsProp } = this.props;

    let mode = paramsProp && paramsProp.get('mode');
    if (!Utils.isNullOrEmpty(mode)) {
      let p1 = paramsProp && paramsProp.get('projectId');
      if (p1) {
        p1 = '/' + p1;
      } else {
        p1 = '';
      }
      Location.push('/' + mode + '/' + optionSel.value + p1);
    }
  };

  onChangeSelectURLDirectFromValueFGVersion = (option1) => {
    if (!option1) {
      return;
    }

    let { paramsProp } = this.props;

    let mode = paramsProp && paramsProp.get('mode');
    if (!Utils.isNullOrEmpty(mode)) {
      let p1 = this.calcProjectId();
      if (p1) {
        p1 = '/' + p1;
      } else {
        p1 = '';
      }

      let param1 = 'datasetVersion=' + encodeURIComponent(option1?.value ?? '');

      let f1 = paramsProp && paramsProp.get('datasetId');
      Location.push('/' + mode + '/' + f1 + p1, undefined, param1);
    }
  };

  memDatasetSchema = memoizeOneCurry((doCall, defDatasetsParam, projectId, datasetId, batchPredId, modelVersion) => {
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

  memDatasetOne = memoizeOne((datasets, datasetId) => {
    return calcDatasetById(undefined, datasetId);
  });

  memProjectDatasets = memoizeOneCurry((doCall, projectDatasets, projectId) => {
    return projectDatasetsReq.memDatasetsByProjectId(doCall, projectDatasets, projectId);
  });

  memDatasetsList = memoizeOneCurry((doCall, datasets, listDatasets, datasetId) => {
    let ids = listDatasets?.map((d1) => d1.dataset?.datasetId);
    if (datasetId) {
      ids = ids ?? [];
      if (!ids.includes(datasetId)) {
        ids = ids.concat(datasetId);
      }
    }
    if (ids != null && ids.length > 0) {
      return datasetsReq.memDatasetListCall(doCall, datasets, ids);
    }
  });

  memRowsColumnsCount: (defDatasets, projects, projectId, datasetId, batchPredId, featureGroupId, modelVersion) => { columnsCount; rowsCount; rowCountForTable } = memoizeOne(
    (defDatasets, projects, projectId, datasetId, batchPredId, featureGroupId, modelVersion) => {
      // let foundProject1 = this.memProjectId(false)(projectId, projects);
      let datasetSchema1 = this.memDatasetSchema(false)(this.props.defDatasets, projectId, datasetId, batchPredId, modelVersion, true);

      let rowsCount = 0,
        rowCountForTable = 0;
      let columnsCount = 0;
      if (datasetSchema1) {
        let fieldsList = datasetSchema1.get('schema');
        if (fieldsList) {
          // columnsCount = fieldsList.filter(x => !x.get('custom')).size;
          columnsCount = fieldsList.size;
        }

        let row_count = datasetSchema1.getIn(['metadata', 'rowCount']);
        if (row_count != null) {
          rowsCount = row_count + 1;
          rowCountForTable = rowsCount; //datasetSchema1.get('totalRowsVisible') ?? 0;
        }
      }
      return { columnsCount, rowsCount, rowCountForTable };
    },
  );

  calcDatasetVersion = () => {
    let res = this.props.paramsProp?.get('datasetVersion');
    if (Utils.isNullOrEmpty(res)) {
      res = null;
    }
    return res;
  };

  memDatasetVersions = memoizeOneCurry((doCall, datasetsParam, datasetId) => {
    return datasets.memDatasetListVersions(doCall, datasetsParam, datasetId);
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

  memListColumns = memoizeOne((datasetOne) => {
    return datasetOne?.toJS()?.schema?.map((f1) => f1.name);
  });

  onChangeSelectedColumns = (columnsList, isNonIgnored, findText) => {
    this.setState({
      selectedColumns: columnsList,
      selectedColumnsNonIgnored: isNonIgnored,
      selectedColumnsText: findText,
    });
  };

  render() {
    let { datasets, defDatasets, paramsProp } = this.props;
    let projectId = this.calcProjectId();
    let datasetId = paramsProp && paramsProp.get('datasetId');
    let batchPredId = paramsProp && paramsProp.get('batchPredId');
    let modelVersion = paramsProp && paramsProp.get('modelVersion');
    let datasetVersion = paramsProp && paramsProp.get('datasetVersion');

    if (!datasetId) {
      return <div></div>;
    }

    let datasetOne = this.memDatasetOne(datasets, datasetId);
    if (datasetOne == null || _.isEmpty(datasetOne)) {
      return <div></div>;
    }

    let fgVersionsList = this.memDatasetVersions(false)(this.props.datasets, datasetId);

    let datasetVersionRowsCount;
    let datasetVersionColumnsCount;
    let datasetError = null;
    let datasetLifecycle;
    if (Utils.isNullOrEmpty(datasetVersion)) {
      datasetLifecycle = datasetOne?.get('status');
    } else {
      let dsVersionOne = fgVersionsList?.find((d1) => d1.datasetVersion === datasetVersion);
      datasetVersionRowsCount = dsVersionOne?.rowCount;
      datasetLifecycle = dsVersionOne?.status;
    }
    if (datasetLifecycle == null) {
      //
    } else if ([DatasetLifecycle.COMPLETE].includes(datasetLifecycle)) {
      //
    } else if ([DatasetLifecycle.CANCELLED, DatasetLifecycle.IMPORTING_FAILED, DatasetLifecycle.INSPECTING_FAILED, DatasetLifecycle.FAILED].includes(datasetLifecycle)) {
      datasetError = <RefreshAndProgress errorMsg={'Dataset ' + DatasetLifecycleDesc[datasetLifecycle]}></RefreshAndProgress>;
    } else {
      datasetError = <RefreshAndProgress isMsgAnimRefresh={true} msgMsg={'Dataset is processing'}></RefreshAndProgress>;
    }

    let isRefreshing = false;
    if (datasets) {
      isRefreshing = datasets.get('isRefreshing');
    }
    if (defDatasets && !isRefreshing) {
      isRefreshing = defDatasets.get('isRefreshing');
    }

    let popupContainerForMenu = (node) => document.getElementById('body2');

    let dataset1 = this.memDataset(false)(defDatasets, projectId, datasetId, batchPredId, modelVersion, datasetVersion);

    const topHH = 151;

    let rowsCount = 0;
    let columnsCount = 0;
    if (dataset1) {
      let fieldsList = dataset1.get('fields');
      if (fieldsList) {
        columnsCount = fieldsList.size;
      }

      let row_count = dataset1.get('rowCount');
      if (row_count != null) {
        if (datasetVersion) {
          datasetVersionColumnsCount = row_count;
        }
        rowsCount = row_count + 1;
      }
    }

    this.memCacheSize(datasetId, rowsCount, columnsCount, this.state.selectedColumns, this.state.selectedColumnsText, this.state.selectedColumnsNonIgnored);

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
      backgroundColor: Constants.backBlueDark(), //Utils.colorA(0.1),
    };
    const STYLE_TOP_RIGHT_GRID = {
      color: '#bfc5d2',
      fontFamily: 'Roboto',
      fontSize: '12px',
      // textTransform: 'uppercase',
      borderBottom: '1px solid ' + borderAAA,
      fontWeight: 'bold',
      backgroundColor: Constants.backBlueDark(), //Utils.colorA(0.05),
    };
    const STYLE_BOTTOM_RIGHT_GRID = {
      outline: 'none',
    };

    let datasetFound = null;
    if (paramsProp && paramsProp.get('datasetId')) {
      datasetFound = calcDatasetById(undefined, paramsProp.get('datasetId'));
    }

    let datasetSelectValue = null;
    let optionsDatasets = [];
    if (datasets) {
      let listDatasetsProj = this.memProjectDatasets(false)(this.props.projectDatasets, projectId);
      let listDatasets = this.memDatasetsList(false)(this.props.datasets, listDatasetsProj, datasetId);
      optionsDatasets = this.memDatasetsOptions(listDatasets);
      if (optionsDatasets && datasetFound) {
        datasetSelectValue = optionsDatasets.find((p1) => p1.value === datasetFound.getIn(['dataset', 'datasetId']));
      }
    }

    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);
    //
    let datasetSchema1 = this.memDatasetSchema(false)(this.props.defDatasets, projectId, datasetId, batchPredId, modelVersion, true);

    let featureGroupId = this.props.paramsProp?.get('featureGroupId');

    let rowsCountRaw = 0;
    let columnsCountRaw = 0;
    if (datasetSchema1) {
      const sizeRes = this.memRowsColumnsCount(defDatasets, this.props.projects, projectId, datasetId, batchPredId, featureGroupId, modelVersion);
      if (sizeRes != null) {
        columnsCountRaw = sizeRes?.columnsCount ?? 0;
        rowsCountRaw = sizeRes?.rowsCount ?? 0;
      }
    }
    if (datasetVersionColumnsCount != null) {
      columnsCountRaw = datasetVersionColumnsCount;
    }
    if (datasetVersionRowsCount != null) {
      rowsCountRaw = datasetVersionRowsCount + 1;
    }

    let gridData = null;
    if (!datasetError) {
      gridData = (width, height) => (
        <MultiGrid
          ref={'gridRef'}
          cellRenderer={this.cellRenderer}
          onSectionRendered={this.gridOnSectionRendered}
          scrollToRow={this.state.scrollToRow}
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

    let optionsFgVersion = this.memDatasetVersionsOptions(fgVersionsList, datasetOne);
    // if(Utils.isNullOrEmpty(datasetVersion)) {
    //   this.memDatasetVersionParam(datasetVersion, optionsFgVersion, datasetOne);
    // }
    let fgVersionSelectValue;
    if (datasetVersion) {
      fgVersionSelectValue = optionsFgVersion?.find((d1) => d1?.value == datasetVersion);
    } else {
      fgVersionSelectValue = optionsFgVersion?.[0];
    }

    let columnsListFilter = this.memListColumns(datasetOne);
    const topHHFilter = 45;

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
                      <div style={{ flex: '0', whiteSpace: 'nowrap', fontWeight: 400 }}>
                        <span>Data Exploration&nbsp;&nbsp;</span>
                        <span style={{ verticalAlign: 'top', paddingTop: '2px', marginLeft: '16px', width: '260px', display: 'inline-block', fontSize: '12px' }}>
                          <SelectExt isDisabled={!!batchPredId} value={datasetSelectValue} options={optionsDatasets} onChange={this.onChangeSelectURLDirectFromValue} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
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

                        {datasetError == null && (
                          <span style={{ marginLeft: '20px', marginRight: '20px' }} className={s.tagItem}>
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
                                <NumberPretty>{rowsCountRaw ? rowsCountRaw - 1 : 0}</NumberPretty>
                              </b>
                            </span>
                          </span>
                        )}
                        {datasetError == null && (
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

                      {datasetError == null && (
                        <div
                          css={`
                            margin-top: 20px;
                            font-size: 14px;
                          `}
                        >
                          <FilterByColumns hideNonIgnoredColumns={true || projectId == null} countIncludeAll onChange={this.onChangeSelectedColumns} columnsList={columnsListFilter} hideCount={true} />
                        </div>
                      )}
                    </div>

                    <div className={sd.table} style={{ position: 'relative', textAlign: 'left', borderTop: '1px solid ' + Constants.lineColor(), height: height - topAfterHeaderHH - topHHFilter - 50 + 'px' }}>
                      {datasetError}
                      {gridData?.(width, height)}
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
  (state: any) => ({
    paramsProp: state.paramsProp,
    projects: state.projects,
    defDatasets: state.defDatasets,
    datasets: state.datasets,
    projectDatasets: state.projectDatasets,
  }),
  null,
)(ProjectDataExplorerOne);
