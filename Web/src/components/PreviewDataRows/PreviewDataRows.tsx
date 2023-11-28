import * as _ from 'lodash';
import * as moment from 'moment';
import Papa from 'papaparse';
import * as React from 'react';
import { CSSProperties } from 'react';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import MultiGrid from 'react-virtualized/dist/commonjs/MultiGrid';
import Utils from '../../../core/Utils';
import REStats_ from '../../api/REStats';
import Constants from '../../constants/Constants';
import memoizeOne from '../../libs/memoizeOne';
import ChartXYExt from '../ChartXYExt/ChartXYExt';
import RefreshAndProgress, { IRefreshAndProgressProgress } from '../RefreshAndProgress/RefreshAndProgress';
const s = require('./PreviewDataRows.module.css');
const sd = require('../antdUseDark.module.css');

const cellHH = 54;
const cellHHchart = 140;

interface IPreviewDataRowsProps {
  file?: File;
}

interface IPreviewDataRowsState {
  isProcessing?: boolean;
  isProcessingSummary?: boolean;
  summaryError?: string;
  processPerc?: any;
  processRowCount?: number;
  processActual?: number;
  processTotal?: number;
  columns?: any[];
  summary?: {
    type: string;
    uniqueForChart: any[];
    unique: any[];
    count: number;
    valid: number;
    missing: number;
    distinct: number;
    min: number;
    max: number;
    mean: number;
    stdev: number;
    median: number;
    q1: number;
    q3: number;
    modeskew: number;
    field: string;
  }[];
  dataList?: any;
  errorLast?: any;
  useRowCount?: number;
}

class PreviewDataRows extends React.PureComponent<IPreviewDataRowsProps, IPreviewDataRowsState> {
  constructor(props) {
    super(props);

    this.state = {
      columns: [],
      useRowCount: 10000,
    };
  }

  componentDidMount() {}

  componentWillUnmount() {}

  memFile = memoizeOne((file1, useRowCount = 100000) => {
    if (file1) {
      setTimeout(() => {
        this.setState({
          isProcessing: true,
          summaryError: null,
        });
      }, 0);

      let percLast = null,
        dataList = [],
        maxLines = useRowCount,
        columns = null,
        alreadyColumn = {},
        unnamedNum = 0;
      Papa.parse(file1, {
        dynamicTyping: false,
        preview: maxLines,
        worker: true,
        header: true,
        // transformHeader: (h1) => {
        //   if(h1==null || h1.replace(/ /g, '')==='') {
        //     h1 = 'UNNAMED_'+unnamedNum;
        //     unnamedNum++;
        //   } else {
        //     h1 = h1.replace(/ /g, '');
        //   }
        //
        //   while(alreadyColumn[h1]) {
        //     h1 += '2';
        //   }
        //   alreadyColumn[h1] = true;
        //
        //   return h1;
        // },
        chunkSize: 256 * 1024,
        chunk: (row, parser) => {
          let dd = row?.data;
          if (dd) {
            dataList = dataList.concat(dd);
          }

          if (columns == null && row.meta?.fields && dd?.[0]) {
            columns = row.meta?.fields?.map((f1, f1ind) => {
              let v1 = dd[0][f1];
              let t1 = '';
              if (_.isString(v1)) {
                t1 = 'string';
              } else if (_.isNumber(v1)) {
                t1 = 'number';
              }

              return {
                name: f1,
                type: t1,
              };
            });
          }

          let perc1: any = (row.meta.cursor / file1.size) * 100;
          perc1 = perc1.toFixed(2);
          if (perc1 !== percLast) {
            this.setState({
              processActual: row.meta.cursor,
              processTotal: file1.size,
              processPerc: perc1,
              processRowCount: dataList.length,
            });
          }

          //parser.abort();
        },
        complete: (results, file) => {
          if (columns != null) {
            let renameField = (name1, name2) => {
              let cEm = columns.find((c1) => c1.name === name1);
              if (cEm) {
                const nameChange = name2;
                cEm.name = nameChange;
                dataList = dataList?.map((d1) => {
                  d1[nameChange] = d1[''];
                  delete d1[''];
                  return d1;
                });
              }
            };

            let unnamedNum = 1;
            renameField('', 'UNNAMED_0');
            columns?.some((f1) => {
              if (!f1.name || f1.name.indexOf(' ') > -1) {
                let f2 = f1.name?.replace(/ /g, '') ?? '';
                if (f2 === '') {
                  f1 = 'UNNAMED_' + unnamedNum;
                  unnamedNum++;
                  renameField(f1, f2);
                }
              }
            });
          }

          this.setState({
            isProcessingSummary: true,
            summaryError: null,
          });
          // @ts-ignore
          REStats_.instance_().processDataList_(dataList, columns, ({ summary, columns, dataList, isOk }) => {
            if (!isOk) {
              dataList = null;
              columns = null;
              summary = null;
            }
            this.setState({
              summaryError: isOk ? null : 'Unable to preview dataset before upload. Please click upload dataset to continue uploading.',
              isProcessingSummary: false,
              isProcessing: false,
              dataList,
              columns,
              summary,
            });
          });
        },
        error: (error1, file) => {
          this.setState({
            isProcessing: false,
            dataList: [],
            columns: [],
            summary: null,
            errorLast: '' + ('Unable to preview dataset before upload. Please click upload dataset to continue uploading.' ?? error1 ?? Constants.errorDefault),
          });
          Utils.error(error1);
        },
        skipEmptyLines: true,
      });
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
      let data1 = this.state.dataList;
      if (data1) {
        let field1 = this.getFieldFromIndex(col);
        return data1[row]?.[field1?.name ?? ''];
      }
    };

    if (rowIndex === 0) {
      if (columnIndex === 0) {
        content = '';
      } else {
        let field1 = this.getFieldFromIndex(columnIndex - 1);
        content = 'Col: ' + columnIndex;
        if (field1) {
          if (field1) {
            content = field1.name || '-';
            // if (_.isString(content)) {
            //   content = Utils.prepareHeaderString(content);
            // }
            // content = <span>{content}&nbsp;<HelpIcon id={'table_header_'+(''+content).toLowerCase()} /></span>;
          }
        }
      }
    } else if (rowIndex === 1) {
      if (columnIndex === 0) {
        content = '';
      } else {
        let field1 = this.getFieldFromIndex(columnIndex - 1);
        if (field1) {
          let sum1 = this.state.summary?.find((s1) => s1.field === field1.name);
          if (sum1) {
            const style1: CSSProperties = {
              color: Utils.colorA(0.85),
            };
            const style2: CSSProperties = {
              whiteSpace: 'nowrap',
            };
            const style3: CSSProperties = {
              color: Utils.colorA(0.7),
            };
            const style2wrap: CSSProperties = {
              whiteSpace: 'normal',
            };

            let mostUsed = null;
            let uu = sum1.unique;
            let uukk = [];
            if (uu) {
              uukk = Object.keys(uu);
              let max = null;
              uukk.some((k1) => {
                let v1 = uu[k1];
                if (max == null || v1 > max) {
                  max = v1;
                  mostUsed = k1;
                }
              });
            }

            content = (
              <div style={{ fontSize: '12px', paddingLeft: '7px', borderLeft: '1px solid ' + Utils.colorA(0.5), width: '100%' }} className={s.nowr}>
                <table style={{ width: '94%', margin: '5px' }} cellSpacing={4}>
                  <tbody>
                    <tr>
                      <td style={style1}>Valid:</td>
                      <td style={style2}>{Utils.prettyPrintNumber(sum1.valid ?? 0, 2)}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td style={style1}>Missing:</td>
                      <td style={style2}>{Utils.prettyPrintNumber(sum1.missing ?? 0, 2)}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td style={style1}>Unique:</td>
                      <td style={style2}>{Utils.prettyPrintNumber(uukk.length, 2)}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td style={style1}>Most Used:</td>
                      <td style={style2wrap}>{mostUsed}</td>
                      <td></td>
                    </tr>

                    <tr style={{ marginTop: '10px' }}>
                      <td style={style1}>Mean:</td>
                      <td style={style2}>{Utils.decimals(sum1.mean ?? 0, 2)}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td style={style1}>Std. Dev.:</td>
                      <td style={style2}>{Utils.decimals(sum1.stdev ?? 0, 2)}</td>
                      <td></td>
                    </tr>

                    <tr style={{ marginTop: '10px' }}>
                      <td style={style1}>Quantiles:</td>
                      <td style={style2}>{sum1.min ?? 0}</td>
                      <td style={style3}>Min</td>
                    </tr>
                    <tr>
                      <td></td>
                      <td style={style2}>{sum1.q1 ?? 0}</td>
                      <td style={style3}>25%</td>
                    </tr>
                    <tr>
                      <td></td>
                      <td style={style2}>{sum1.median ?? 0}</td>
                      <td style={style3}>50%</td>
                    </tr>
                    <tr>
                      <td></td>
                      <td style={style2}>{sum1.q3 ?? 0}</td>
                      <td style={style3}>75%</td>
                    </tr>
                    <tr>
                      <td></td>
                      <td style={style2}>{sum1.max ?? 0}</td>
                      <td style={style3}>Max</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          }
        }
      }
    } else if (rowIndex === 2) {
      if (columnIndex === 0) {
        content = '';
      } else {
        let field1 = this.getFieldFromIndex(columnIndex - 1);
        if (field1) {
          let sum1 = this.state.summary?.find((s1) => s1.field === field1.name);
          if (sum1) {
            let data1 = [],
              labels = [];
            let kk = Object.keys(sum1.uniqueForChart);
            kk.some((k1) => {
              let v1 = sum1.uniqueForChart[k1];

              labels.push(k1);
              data1.push({ x: k1, y: v1 });
            });
            content = <ChartXYExt data={{ tooltips: true, data: data1, labels: labels }} noTitles={true} height={cellHHchart - 2 * 4} type={'bar'} colorIndex={0} />;
          }
        }

        // let data1 = this.state.dataList;
        // if(field1 && data1 && (field1.type==='numeric' || field1.type==='integer')) {
        //   let list = [];
        //   data1.some(d1 => {
        //     let v1 = d1[field1.name];
        //     if(v1!=null) {
        //       list.push(v1);
        //     }
        //   });
        //   let bins = echartsstat.histogram(list);
        //   console.log(bins);
        // }
      }
    } else {
      if (columnIndex === 0) {
        content = '' + (rowIndex - 2);
      } else {
        content = getValue(rowIndex - 3, columnIndex - 1);
        if (content == null) {
          if (isScrolling) {
            content = '...';
          }
        } else {
          let field1 = this.getFieldFromIndex(columnIndex - 1);
          if (field1) {
            if (field1.type === 'date') {
              let dt1 = moment(content);
              if (dt1.isValid()) {
                content = dt1.format('YYYY-MM-DD HH:mm:ss');
              }
            } else if (['integer'].includes(field1.type)) {
              // content = content;
            } else if (['number', 'float'].includes(field1.type)) {
              content = Utils.roundDefault(content);
            } else if (field1.type === 'chart') {
              content = <ChartXYExt data={content} noTitles={true} height={cellHH - 2 * 4} type={'bar'} colorIndex={0} />;
            }
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
    let cc = this.state.columns;
    if (cc) {
      return cc[index];
    }
  };

  gridColumnWidth = ({ index }) => {
    if (index === 0) {
      return 80;
    }

    let field1 = this.getFieldFromIndex(index - 1);
    if (field1) {
      let type1 = field1.type;

      if (type1 === 'array') {
        return 200;
      } else if (type1 === 'string') {
        return 240;
      } else if (type1 === 'integer' || type1 === 'number') {
        return 160;
      } else if (type1 === 'date') {
        return 200;
      } else {
        return 120;
      }
    }

    return 100;
  };

  calcRowHeight = ({ index }) => {
    if (index === 1) {
      return 240;
    } else if (index === 2) {
      return cellHHchart;
    } else {
      return cellHH;
    }
  };

  onClickRowCount = (rowCount, e) => {
    this.setState({
      useRowCount: rowCount,
    });
  };

  render() {
    let { file } = this.props;

    this.memFile(file, this.state.useRowCount);
    let progress: IRefreshAndProgressProgress = null;
    if (this.state.isProcessingSummary) {
      progress = {
        label: 'Processing Summaries/Stats...',
      };
    } else if (this.state.isProcessing) {
      progress = {
        actual: this.state.processActual,
        total: this.state.processTotal,
        label: '' + this.state.processPerc + '%',
      };
    }

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

    const topHH = 95;

    let rowsCount = this.state.processRowCount ?? 0;
    let columnsCount = this.state.columns?.length ?? 0;

    const ee = '30px';
    const rowCC = [
      {
        count: 1000,
        name: '1K',
      },
      {
        count: 10000,
        name: '10K',
      },
      {
        count: 100000,
        name: '100K',
      },
      {
        count: 1000000,
        name: '1M',
      },
    ];

    return (
      <div className={sd.grayDarkPanel}>
        <div style={{ textAlign: 'center', fontSize: '13px', paddingTop: '8px' }}>Preview Data</div>
        <div style={{ textAlign: 'center', marginTop: '6px' }}>
          <span style={{ marginRight: '10px', color: Utils.colorA(0.7) }}>Process:</span>
          {rowCC.map((r1, r1ind) => {
            let style1: CSSProperties = { cursor: 'pointer' };
            if (r1.count === this.state.useRowCount) {
              style1.color = 'blue';
            }
            return (
              <span key={'rowC_' + r1.count}>
                {r1ind > 0 ? <span style={{ margin: '0 14px' }}>-</span> : null}
                <span className={sd.styleTextBlueBright} style={style1} onClick={this.onClickRowCount.bind(this, r1.count)}>
                  {r1.name} rows
                </span>
              </span>
            );
          })}
        </div>

        <div style={{ position: 'relative', height: '580px', width: '100%', minWidth: '600px' }}>
          <RefreshAndProgress progress={progress} isRefreshing={this.state.isProcessing || this.state.isProcessingSummary} errorMsg={this.state.summaryError}>
            <div style={{ position: 'absolute', top: ee, left: ee, right: ee, bottom: ee, color: 'white' }}>
              <AutoSizer ref={'sizer'}>
                {({ width, height }) => (
                  <MultiGrid
                    ref={'gridRef'}
                    cellRenderer={this.cellRenderer}
                    className={s.gridAfter}
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
                    columnCount={columnsCount + 1}
                    columnWidth={this.gridColumnWidth}
                    height={height}
                    rowCount={rowsCount + 3}
                    rowHeight={this.calcRowHeight}
                    width={width}
                  />
                )}
              </AutoSizer>
            </div>
          </RefreshAndProgress>
        </div>
      </div>
    );
  }
}

export default PreviewDataRows;
