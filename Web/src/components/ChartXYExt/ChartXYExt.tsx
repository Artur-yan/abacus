import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import Button from 'antd/lib/button';
import Input from 'antd/lib/input';
import Menu from 'antd/lib/menu';
import Modal from 'antd/lib/modal';
import Chartist from 'chartist';
import 'chartist-plugin-axistitle';
import * as echarts from 'echarts';
import { EChartsOption } from 'echarts';
import * as Immutable from 'immutable';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { CSSProperties } from 'react';
import ChartistGraph from 'react-chartist';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import * as uuid from 'uuid';
import Utils, { ReactLazyExt } from '../../../core/Utils';
import RECSS from '../../api/RECSS';
import Constants from '../../constants/Constants';
import memoizeOne from '../../libs/memoizeOne';
import DropdownExt from '../DropdownExt/DropdownExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./ChartXYExt.module.css');
const sd = require('../antdUseDark.module.css');
const ReactEcharts = ReactLazyExt(() => import('echarts-for-react'));
const { confirm } = Modal;

export const maxColors = 40;
const extraColors = ['#7e4ce8', '#55c0da', '#9558ff', '#2f5eff'];
const extraColors2 = [
  { from: '#9137ff', to: '#4b00a7' },
  { from: '#245bff', to: '#002bc9' },
  { from: '#06edbd', to: '#006870' },
  { from: '#ff5bf4', to: '#7e05b1' },
  { from: '#ffc443', to: '#db5704' },
];
export const maxColorsMod = maxColors + extraColors.length + extraColors2.length;
let alreadyCssInjected = false;
let actualColorIndex = 0;
let alreadyUsedDarkModeSet = false;

interface IChartXYExtProps {
  data?: any;
  index?: number;
  nicer?: boolean;
  noTitles?: boolean;
  height?: number;
  width?: number;
  type?: string;
  useAM4?: boolean;
  useEC?: boolean;
  colorIndex?: number;
  startColorIndex?: number;
  hideValuesBar?: boolean;
  axisYMin?: number;
  axisYMax?: number;
  colorFixed?: string | { from: string; to: string }[] | string[];
  colorFixedAndMore?: number;
  noGrid?: boolean;
  lineFilled?: boolean;
  noMax?: boolean;
  showDownload?: boolean;
  topElem?: any;
  startColor?: string;
  endColor?: string;
  startHighlightColor?: string;
  endHighlightColor?: string;
  verticalXAxisLabels?: boolean;
  wait?: number;
}

interface IChartXYExtState {
  isWaitingToRender?: boolean;
}

let needToDoList: any = [];
let needToDoTimer: any = null;

const needToDo = (cb) => {
  if (needToDoTimer) {
    clearTimeout(needToDoTimer);
    needToDoTimer = null;
  }

  needToDoList.push(cb);
  needToDoTimer = setTimeout(() => {
    needToDoTimer = null;

    needToDoList.some((cb) => {
      cb();
    });

    needToDoList = [];
  }, 0);
};

class ChartXYExt extends React.PureComponent<IChartXYExtProps, IChartXYExtState> {
  private chartsList: any[];
  private isM: boolean;
  breakdown: { id: any[]; names: any[]; values: any[] };
  breakdownDoExportFG: any;
  xAxisValues: any;
  confirmList: any;
  breakdownSort: any;
  breakdownButtons: any;
  onClickChart: any;
  chartRef: any;
  intervalChartRef: NodeJS.Timeout;

  constructor(props) {
    super(props);

    this.state = {
      isWaitingToRender: false,
    };

    this.chartsList = [];
  }

  echartOnClick = (params) => {
    if (this.onClickChart != null) {
      this.onClickChart(params);
    }

    if (this.breakdown != null) {
      let dataIndex = params?.dataIndex;

      if (params?.targetType === 'axisLabel' && this.xAxisValues) {
        dataIndex = this.xAxisValues?.findIndex((v1) => v1 === params.value);
      }

      if (dataIndex != null) {
        const b1 = this.breakdown[dataIndex];
        if (b1 != null && _.isArray(b1) && b1.length > 0) {
          let columns = b1?.[0].names.map(
            (n1, n1ind) =>
              ({
                field: n1,
                title: n1,
                render: (text, row, index) => {
                  if (_.isNumber(text)) {
                    let decimals1 = b1?.[0]?.decimals?.[n1ind] ?? 3;
                    text = Utils.decimals(text, decimals1);

                    let format1 = b1?.[0]?.format?.[n1ind];
                    if (!Utils.isNullOrEmpty(format1)) {
                      text += format1;
                    }
                  }

                  if (n1.toLowerCase() === 'id') {
                    text = b1?.[row.index]?.idLinks?.[0];
                  }

                  return text;
                },
              } as ITableExtColumn),
          );
          let dataList = b1.map((d1, d1ind) => {
            let res = {} as any;
            d1.names.map((n1, n1ind) => {
              res[n1] = d1.values[n1ind];
            });
            return res;
          });
          let dataListJson = 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataList, undefined, 2));
          let dataListCsv =
            'data:text/plain;charset=utf-8,' +
            encodeURIComponent(
              dataList
                .map((d1, d1ind) => {
                  let line1 = '',
                    line0 = '';
                  b1?.[0].names?.some((n1, n1ind) => {
                    if (n1ind > 0) {
                      if (d1ind === 0) {
                        line0 += ',';
                      }
                      line1 += ',';
                    }

                    if (d1ind === 0) {
                      line0 += '"' + n1.replace(/"/g, '\\"') + '"';
                    }
                    line1 += '' + d1[n1];
                  });

                  if (d1ind === 0) {
                    return line0 + '\n' + line1 + '\n';
                  } else {
                    return line1 + '\n';
                  }
                })
                .join(''),
            );

          dataList?.some((d1, d1ind) => {
            d1.index = d1ind;
          });

          let defaultSort =
            b1?.[0]?.names?.length === 0
              ? null
              : {
                  field: b1?.[0]?.names?.[0],
                  isAsc: true,
                };
          const b2 = this.breakdownSort;
          if (b2?.index != null) {
            defaultSort = {
              field: b1?.[0].names?.[b2?.index],
              isAsc: b2?.isAsc === true,
            };
          }

          let quartileMetrics = b1?.[0]?.quartileMetrics;
          let quartileMetricsElem = null;
          if (quartileMetrics != null && _.isArray(quartileMetrics) && quartileMetrics.length > 0) {
            quartileMetricsElem = (
              <div
                css={`
                  font-size: 14px;
                  text-align: center;
                  margin-bottom: 20px;
                `}
              >
                <div
                  css={`
                    padding: 5px 0;
                  `}
                >
                  Quartile Metrics:
                </div>
                {quartileMetrics?.map((m1, m1ind) => {
                  return (
                    <span key={'met_' + m1ind}>
                      {m1ind > 0 ? <span>, </span> : null}
                      <span
                        css={`
                          opacity: 0.8;
                          margin-right: 5px;
                        `}
                      >
                        {(m1.name ?? '') + ':'}
                      </span>
                      <span>{m1.value}</span>
                    </span>
                  );
                })}
              </div>
            );
          }

          if (this.confirmList != null) {
            this.confirmList.destroy();
            this.confirmList = null;
          }
          this.confirmList = confirm({
            title: 'IDS + Metrics (' + (dataList?.length ?? 0) + ')',
            okText: 'Ok',
            okType: 'primary',
            cancelText: 'Cancel',
            cancelButtonProps: { style: { display: 'none' } },
            maskClosable: true,
            width: 800,
            content: (
              <div css={``}>
                {quartileMetricsElem}
                <div
                  css={`
                    border: 2px solid rgba(0, 0, 0, 0.3);
                    padding-right: 4px;
                  `}
                >
                  <TableExt noAutoTooltip defaultSort={defaultSort} height={300} columns={columns} dataSource={dataList} isVirtual isDetailTheme={false} whiteText />
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
                  {(this.breakdownButtons as any)?.(dataIndex)}
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
      }
    }
  };

  createButtonDownload = (data) => {
    if (!this.props.showDownload) {
      return null;
    }

    let popupContainerForMenu = (node) => document.getElementById('body2');
    const onClickVoid = (event) => {
      if (event && event.domEvent) {
        event.domEvent.stopPropagation();
      }
    };

    let resJson = [];
    let resCsv = [];

    const escape1 = (v1) => {
      return v1?.replace(/[",]/g, '_');
    };

    let dataData = data?.dataDownload?.data ?? data?.data;
    if (this.props.data?.isScatter === true) {
      let sY = ['x', 'y'];

      let s1 = '';
      sY.some((k1, k1ind) => {
        let name1 = k1;
        if (k1ind > 0) {
          s1 += ',';
        }
        s1 += '"' + escape1(name1) + '"';
      });
      resCsv.push(s1);

      dataData?.some((d1, d1ind) => {
        let obj1: any = {};
        let s1 = '';
        sY.some((k1, k1ind) => {
          let name1 = k1;
          if (k1ind > 0) {
            s1 += ',';
          }

          let v1 = d1?.[k1];

          if (_.isObject(v1)) {
            v1 = null;
          }

          //
          if (_.isString(v1)) {
            s1 += '"' + escape1(v1) + '"';
          } else {
            s1 += '' + (v1 ?? '');
          }

          obj1[name1] = v1;
        });
        //
        resCsv.push(s1);
        resJson.push(obj1);
      });
    } else if (this.props.type === 'heatmap') {
      let matrix = dataData?.matrix;
      if (matrix) {
        matrix.some((line, lineind) => {
          let s1 = '';
          line?.some((v1, v1ind) => {
            if (v1ind > 0) {
              s1 += ',';
            }

            if (_.isObject(v1)) {
              v1 = null;
            }

            //
            if (_.isString(v1)) {
              s1 += '"' + escape1(v1) + '"';
            } else {
              s1 += '' + (v1 ?? '');
            }

            if (lineind > 0 && v1ind > 0) {
              let obj1: any = {
                col: matrix?.[0]?.[v1ind],
                row: matrix?.[lineind]?.[0],
                value: v1,
              };
              resJson.push(obj1);
            }
          });

          resCsv.push(s1);
        });
      }
    } else if (data?.seriesY != null) {
      let sY = [...(data?.seriesY ?? [])];
      let dontAddX = data?.downloadIgnoreX === true;
      let renameXby = data?.downloadRenameX;
      if (!dontAddX) {
        sY.unshift('x');
      }

      let s1 = '';
      sY.some((k1, k1ind) => {
        let name1 = k1;
        if (k1 === 'x' && !dontAddX) {
          name1 = renameXby ?? 'name';
        }

        if (k1ind > 0) {
          s1 += ',';
        }
        s1 += '"' + escape1(name1) + '"';
      });
      resCsv.push(s1);

      dataData?.some((d1, d1ind) => {
        let obj1: any = {};
        let s1 = '';
        sY.some((k1, k1ind) => {
          let name1 = k1;
          if (k1 === 'x' && !dontAddX) {
            name1 = renameXby ?? 'name';
          }

          if (k1ind > 0) {
            s1 += ',';
          }

          let v1 = d1?.[k1];

          if (_.isObject(v1)) {
            v1 = null;
          }

          if (_.isString(v1)) {
            s1 += '"' + escape1(v1) + '"';
          } else {
            s1 += '' + (v1 ?? '');
          }

          obj1[name1] = v1;
        });
        resCsv.push(s1);
        resJson.push(obj1);
      });
    }

    let dataListJson = 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(resJson ?? '', undefined, 2));
    let dataListCsv = 'data:text/plain;charset=utf-8,' + encodeURIComponent(resCsv.join('\n'));
    let name1 = data?.title || 'chart';
    name1 = name1.replace(/ /gi, '_');
    let downloadJsonFilename = name1 + '.json';
    let downloadCsvFilename = name1 + '.csv';
    const menu = (
      <Menu onClick={onClickVoid} getPopupContainer={popupContainerForMenu}>
        <Menu.Item key={'csv'}>
          <a href={dataListCsv} download={downloadCsvFilename}>
            Download CSV
          </a>
        </Menu.Item>
        {resJson != null && (
          <Menu.Item key={'json'}>
            <a href={dataListJson} download={downloadJsonFilename}>
              Download JSON
            </a>
          </Menu.Item>
        )}
      </Menu>
    );

    return (
      <DropdownExt overlay={menu} trigger={['click']} placement={'bottomRight'}>
        <Button
          css={`
            margin-right: 5px;
            font-size: 13px;
            border-color: rgba(255, 255, 255, 0.6);
          `}
          ghost
          size={'small'}
          type={'default'}
        >
          Download
        </Button>
      </DropdownExt>
    );
  };

  doExportFGFirst = (e) => {
    this.doExportFGTablname = '';
  };

  doExportFGTablname = '';
  doExportFG = (exportFG: (tablename: string) => Promise<boolean>) => {
    return new Promise<boolean>((resolve) => {
      if (exportFG == null) {
        resolve(true);
        return;
      }

      exportFG(this.doExportFGTablname)?.then((res) => {
        resolve(res);
      });
    });
  };

  memData = memoizeOne((data?: any, width?) => {
    this.breakdown = null;
    this.breakdownDoExportFG = null;
    this.breakdownButtons = null;
    this.breakdownSort = null;

    if (data) {
      if (Immutable.isImmutable(data)) {
        data = data.toJS();
      }

      let div1 = null;

      if (this.props.useEC) {
        let chartHelpIdTopRight = data?.chartHelpIdTopRight;
        let chartHelpIdTopRight2 = 'chart_' + ((_.isString(data.title) ? data.title : null) ?? '');
        let option1 = this.createLineEC(data.title, data.data, this.props.index || 0, data.dateX, data);

        let style1 = {} as CSSProperties;
        if (this.props.width) {
          style1.width = this.props.width + 'px';
        }
        let hh = this.props.height || 150;
        if (data.bottomLineHH != null && data.bottomLine != null) {
          hh -= data.bottomLineHH;
        }
        if (hh) {
          style1.height = hh + 'px';
        }
        let bottomLine = data.bottomLine;

        if (data?.useLegendBottom) {
          let legendBottom = null;
          let ll = [];
          (option1?.series as any[])?.some((s1) => {
            if (s1 != null) {
              s1?.data?.some((d1, d1ind) => {
                if (!Utils.isNullOrEmpty(d1?.name)) {
                  let color1 = s1?.color?.[d1ind];
                  ll.push(
                    <div
                      css={`
                        display: flex;
                        align-items: center;
                        font-family: Matter;
                        font-size: 15px;
                        font-weight: 500;
                        line-height: 1.2;
                      `}
                      key={'c1_' + d1ind}
                    >
                      <span
                        css={`
                          flex: 0 0 12px;
                          margin-right: 8px;
                          border-radius: 50%;
                          width: 12px;
                          height: 12px;
                          background: ${color1 ?? '#fff'};
                        `}
                      ></span>
                      <span>{d1?.name}</span>
                    </div>,
                  );
                }
              });
            }
          });
          if (ll.length > 0) {
            legendBottom = (
              <div
                css={`
                  display: grid;
                  grid-template-columns: repeat(2, 1fr);
                  grid-column-gap: 10px;
                  grid-row-gap: 10px;
                  margin-top: 4px;
                `}
              >
                {ll}
              </div>
            );
          }
          // console.warn(option1)

          if (bottomLine == null) {
            bottomLine = legendBottom;
          } else {
            bottomLine = (
              <div>
                {bottomLine}
                {legendBottom}
              </div>
            );
          }
        }

        let downloadButtonRight = this.createButtonDownload(data);
        let helpIcontopRight = null;
        if (chartHelpIdTopRight || chartHelpIdTopRight2 || downloadButtonRight) {
          helpIcontopRight = (
            <div
              css={`
                position: absolute;
                top: 5px;
                right: 12px;
                z-index: 5;
              `}
            >
              {downloadButtonRight}
              <HelpIcon id={chartHelpIdTopRight} />
              {chartHelpIdTopRight !== chartHelpIdTopRight2 && <HelpIcon id={chartHelpIdTopRight2} />}
            </div>
          );
        }

        let chartHelpIdBottomRight = 'chart_' + ((_.isString(data.title) ? data.title : null) ?? '') + '_bottomRight';
        let exportFGElem = null;
        if (this.breakdownDoExportFG != null && _.isFunction(this.breakdownDoExportFG)) {
          const titleConfirm = (
            <div className={'useDark'}>
              <div>{'Export to Feature Group'}</div>
              <div style={{}}>Tablename:</div>
              <Input
                style={{ marginTop: '8px', color: 'white' }}
                placeholder={''}
                defaultValue={''}
                onChange={(e) => {
                  this.doExportFGTablname = e.target.value;
                }}
              />
            </div>
          );

          exportFGElem = (
            <div
              css={`
                position: absolute;
                bottom: 10px;
                right: 12px;
                z-index: 5;
              `}
            >
              <ModalConfirm
                onClick={this.doExportFGFirst}
                onConfirmPromise={this.doExportFG.bind(this, this.breakdownDoExportFG)}
                title={titleConfirm}
                icon={<QuestionCircleOutlined style={{ color: 'green' }} />}
                okText={'Export'}
                cancelText={'Cancel'}
                okType={'primary'}
              >
                <Button
                  css={`
                    margin-right: 5px;
                    font-size: 13px;
                    border-color: rgba(255, 255, 255, 0.6);
                  `}
                  ghost
                  size={'small'}
                  type={'default'}
                >
                  Export FG
                </Button>
              </ModalConfirm>
              <HelpIcon id={chartHelpIdBottomRight} />
            </div>
          );
        }

        let topElem = this.props.topElem;

        if (style1.width && style1.height) {
          div1 = (
            <React.Suspense fallback={<div></div>}>
              <div
                css={`
                  position: relative;
                `}
              >
                {helpIcontopRight}
                {exportFGElem}
                <ReactEcharts
                  key={'a' + Math.random()}
                  ref={(r1) => {
                    this.chartRef = r1;
                  }}
                  option={option1}
                  style={style1}
                  theme={'dark'}
                  onEvents={{ click: this.echartOnClick }}
                />
                {bottomLine}
              </div>
            </React.Suspense>
          );
        } else {
          div1 = (
            <React.Suspense fallback={<div></div>}>
              <div style={{ position: 'relative', display: 'inline-block', width: style1.width || '100%', height: style1.height || '100%' }}>
                {helpIcontopRight}
                {exportFGElem}
                <AutoSizer>
                  {({ height, width }) => {
                    if (bottomLine != null && data.bottomLineHH != null) {
                      height -= data.bottomLineHH;
                    }

                    let style2 = _.assign({}, style1);
                    if (!style2.width && width) {
                      style2.width = width + 'px';
                    }
                    if (!style2.height && height) {
                      style2.height = height + 'px';
                    }

                    const ch1 = (
                      <ReactEcharts
                        key={'a' + Math.random()}
                        ref={(r1) => {
                          this.chartRef = r1;
                        }}
                        option={option1}
                        style={style2}
                        theme={'dark'}
                        onEvents={{ click: this.echartOnClick }}
                      />
                    );

                    if (bottomLine == null) {
                      return ch1;
                    } else {
                      return (
                        <div>
                          {ch1}
                          {bottomLine}
                        </div>
                      );
                    }
                  }}
                </AutoSizer>
              </div>
            </React.Suspense>
          );
        }

        if (topElem != null) {
          div1 = (
            <div>
              {topElem}
              {div1}
            </div>
          );
        }

        if (this.intervalChartRef != null) {
          clearInterval(this.intervalChartRef);
          this.intervalChartRef = null;
        }
        this.intervalChartRef = setInterval(() => {
          if (!this.isM) {
            clearInterval(this.intervalChartRef);
            this.intervalChartRef = null;
            return;
          }
          if (this.chartRef != null) {
            clearInterval(this.intervalChartRef);
            this.intervalChartRef = null;

            let echartsInstance = this.chartRef.getEchartsInstance();
            let zr = echartsInstance.getZr();

            zr.on('click', (params) => {
              let pointInPixel = [params.offsetX, params.offsetY];
              let pointInGrid = echartsInstance.convertFromPixel('grid', pointInPixel);
              params.pointInGrid = pointInGrid;

              this.onClickChart?.(params);
            });
          }
        }, 100);
      } else if (this.props.useAM4) {
        let style1: CSSProperties = {};
        if (this.props.height) {
          style1.height = this.props.height + 'px';
        }

        let chId = 'chart_' + uuid.v1();
        div1 = <div key={chId} ref={chId} id={chId} style={style1}></div>;
        needToDo(() => {
          if (!this.isM) {
            return;
          }

          this.createLine(chId, data.title, data.data, this.props.index || 0, data.dateX, data).then((chart1) => {
            if (chart1) {
              this.chartsList.push(chart1);
            }
          });
        });
      } else {
        let chartHelpIdTopRight = data?.chartHelpIdTopRight;
        let chartHelpIdTopRight2 = 'chart_' + ((_.isString(data.title) ? data.title : null) ?? '');
        let downloadButtonRight = this.createButtonDownload(data);
        let helpIcontopRight = null;
        if (chartHelpIdTopRight || chartHelpIdTopRight2 || downloadButtonRight) {
          helpIcontopRight = (
            <div
              css={`
                position: absolute;
                top: 5px;
                right: 12px;
                z-index: 5;
              `}
            >
              {downloadButtonRight}
              <HelpIcon id={chartHelpIdTopRight} />
              {chartHelpIdTopRight !== chartHelpIdTopRight2 && <HelpIcon id={chartHelpIdTopRight2} />}
            </div>
          );
        }

        div1 = this.createChartSync(data, helpIcontopRight);
      }

      return div1;
    }
  });

  createChartSync = (data?: any, helpIcontopRight?: any) => {
    if (!data) {
      return <div></div>;
    }

    let { noTitles } = this.props;

    const isDateX = data.dateX;
    const isBar = this.props.type === 'bar' || data.chartType === 'bar';
    const isBarHor = this.props.type === 'barhor' || data.chartType === 'barhor';
    const isBarVert = this.props.type === 'barver' || data.chartType === 'barver';

    if (isBarHor || isBarVert) {
      let resBarHor: any = [];
      let min = null,
        max = null;

      if (data.data) {
        data.data.some((d1: any) => {
          if (_.isObject(d1)) {
            d1 = (d1 as any).value;
          }
          if (d1 != null) {
            if (min == null) {
              min = d1;
            } else if (d1 < min) {
              min = d1;
            }
            if (max == null) {
              max = d1;
            } else if (d1 > max) {
              max = d1;
            }
          }
        });

        data.data.some((d1: any, d1ind) => {
          let v1 = d1;
          let desc = null;
          if (_.isObject(d1)) {
            v1 = (d1 as any).value;
            desc = (d1 as any).meta;
          }
          if (v1 == null) {
            v1 = 0;
          }

          let perc = max === 0 ? 0 : (100 / max) * v1;
          const hh = data.barWidth ?? 16;

          let value1 = null;
          if (!this.props.hideValuesBar) {
            value1 = Utils.decimals(v1, 6);
          }

          let bh1;
          if (isBarHor) {
            bh1 = (
              <div key={'barhor_' + d1ind} style={{ marginTop: '4px' }}>
                <div style={{ height: hh + 'px', marginBottom: '4px', position: 'relative' }}>
                  <div style={{ width: perc <= 0.9 ? '1px' : Math.trunc(perc) + '%', height: hh + 'px', position: 'absolute', right: 0, top: 0, backgroundColor: Constants.blue }}>&nbsp;</div>
                  <div style={{ height: hh + 'px', position: 'absolute', right: 0, top: 0, fontSize: '13px', color: 'white', lineHeight: '16px' }}>
                    <span style={{ color: Utils.colorA(0.8) }}>{desc}</span>&nbsp;{value1}&nbsp;
                  </div>
                </div>
              </div>
            );
          } else {
            bh1 = (
              <div key={'barver_' + d1ind} style={{ display: 'inline-block', marginLeft: '4px', height: '100%' }}>
                <div style={{ width: hh + 'px', marginRight: '4px', position: 'relative', height: '100%' }}>
                  <div style={{ height: perc <= 0.9 ? '1px' : Math.trunc(perc) + '%', width: hh + 'px', position: 'absolute', bottom: 0, left: 0, backgroundColor: Constants.blue }}>&nbsp;</div>
                  <div
                    style={{
                      transform: 'translateY(-100%) rotate(90deg) translateX(-' + (2 + (data.moveLabelVert ?? 0)) + 'px)',
                      width: hh + 'px',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      fontSize: '13px',
                      color: 'white',
                      lineHeight: '16px',
                    }}
                  >
                    <span style={{ whiteSpace: 'nowrap', color: Utils.colorA(0.8) }}>
                      <span>{desc}</span>
                      {value1 != null && <span>&nbsp;{value1}&nbsp;</span>}
                    </span>
                  </div>
                </div>
              </div>
            );
          }
          resBarHor.push(bh1);
        });
      }

      if (!Utils.isNullOrEmpty(data.titleX)) {
        resBarHor = (
          <div style={{ display: 'flex', flexFlow: 'column', height: '100%' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              {helpIcontopRight}
              {resBarHor}
            </div>
            <div style={{ position: 'relative', flex: '0 0 20px', paddingTop: '5px', fontSize: '14px', color: 'white', textAlign: 'center' }}>{data.titleX}</div>
          </div>
        );
        helpIcontopRight = null;
      }
      if (!Utils.isNullOrEmpty(data.titleY)) {
        resBarHor = (
          <div style={{ display: 'flex', flexFlow: 'row', height: '100%' }}>
            <div
              style={{
                width: '20px',
                flex: '0 0 20px',
                transform: 'translateY(-50%) rotate(90deg) translateX(' + (40 + (data.moveTitleYVert ?? 0)) + 'px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                paddingLeft: '5px',
                fontSize: '14px',
                color: 'white',
                textAlign: 'center',
              }}
            >
              <span style={{ whiteSpace: 'nowrap' }}>{data.titleY}</span>
            </div>
            <div style={{ position: 'relative', flex: 1 }}>
              {helpIcontopRight}
              {resBarHor}
            </div>
          </div>
        );
      }

      return resBarHor;
    }

    let options: any = {
      showLine: true,
      showPoint: false,
      height: (this.props.height || 150) + 'px',
      axisX: {
        showLabel: !noTitles,
        type: Chartist.FixedScaleAxis,
        labelInterpolationFnc: function (value) {
          return isDateX ? moment(value).format('MMM D YYYY, HH:mm') : value;
        },
        divisor: 2,
      },
      axisY: {
        showLabel: !noTitles,
        offset: 70,
        type: Chartist.AutoScaleAxis,
      },

      fullWidth: true,
      chartPadding: {
        left: noTitles ? 0 : 12,
        right: noTitles ? 0 : 12,
        top: noTitles ? 0 : 22,
        bottom: noTitles ? 0 : !noTitles && data.titleX ? 30 : 2,
      },
    };
    if (data.spaceX != null) {
      options.seriesBarDistance = data.spaceX;
    }
    if (noTitles) {
      options.axisX.offset = 0;
      options.axisY.offset = 0;
    }
    if (data.isScatterMetric) {
      options.chartPadding.bottom += 20;
      options.chartPadding.right += 20;
    }
    if (data.isScatter && !data.isScatterLine) {
      options.showLine = false;
      options.showPoint = true;
    }

    if (data.divisorX === null) {
      delete options.axisX.divisor;
      options.axisX.type = Chartist.AutoScaleAxis;
    } else if (data.divisorX != null) {
      options.axisX.divisor = data.divisorX;
    }
    if (data.axisXrenderValue != null) {
      options.axisX.labelInterpolationFnc = (value) => {
        return data.axisXrenderValue(value);
      };
    }

    if (data.divisorY === null) {
      delete options.axisY.divisor;
    } else if (data.divisorY != null) {
      options.axisY.divisor = data.divisorY;
    }
    if (data.axisYrenderValue != null) {
      options.axisY.labelInterpolationFnc = (value) => {
        return data.axisYrenderValue(value);
      };
    }

    if (data.xlim != null && _.isArray(data.xlim) && data.xlim.length >= 2) {
      options.axisX.type = Chartist.FixedScaleAxis;
      options.axisX.low = data.xlim[0];
      options.axisX.high = data.xlim[1];
    }
    if (data.ylim != null && _.isArray(data.ylim) && data.ylim.length >= 2) {
      options.axisY.type = Chartist.FixedScaleAxis;
      options.axisY.low = data.ylim[0];
      options.axisY.high = data.ylim[1];
    }

    if (data.sameMaxXY != null) {
      let maxX, maxY;
      data?.data?.some((d1, d1ind) => {
        let x1 = d1?.[data.sameMaxXY[0]];
        let y1 = d1?.[data.sameMaxXY[1]];

        if (maxX == null || x1 > maxX) {
          maxX = x1;
        }
        if (maxY == null || y1 > maxY) {
          maxY = y1;
        }
      });
      if (maxX != null && maxY != null) {
        const maxM = Math.max(maxX, maxY);
        options.axisX.type = Chartist.FixedScaleAxis;
        options.axisX.high = maxM * 1.1;
        options.axisY.type = Chartist.FixedScaleAxis;
        options.axisY.high = maxM * 1.1;
      }
    }

    if (!noTitles) {
      let titObj: any = {},
        anyTitle = false;
      if (data.titleX) {
        anyTitle = true;
        titObj.axisX = {
          axisTitle: data.titleX,
          axisClass: 'ct-axis-title',
          offset: {
            x: 0,
            y: 40,
          },
          textAnchor: 'middle',
        };
      }
      if (data.titleY) {
        anyTitle = true;
        titObj.axisY = {
          axisTitle: data.titleY,
          axisClass: 'ct-axis-title',
          offset: {
            x: 0,
            y: data.isScatterMetric ? -20 : -8,
          },
          textAnchor: 'middle',
          flipTitle: false,
        };
      }

      if (anyTitle) {
        options.plugins = [Chartist.plugins.ctAxisTitle(titObj)];
      }
    }

    let dataList = data.data || [];
    if (isDateX) {
      dataList = dataList.sort((a, b) => {
        return a.x - b.x;
      });

      dataList = dataList.map((d1) => ({
        x: moment(d1.x).toDate(),
        y: d1.y,
      }));
    }

    let dataChart: any = {
      series: [dataList],
    };

    let labels = data.labels;
    if (data.isScatter && !labels) {
      labels = dataList?.map((d1, d1ind) => d1ind + 1);
    }

    if (labels) {
      dataChart.labels = labels;

      if (data.tooltips) {
        options.plugins = options.plugins || [];
      }
    }

    let colorInd = actualColorIndex;
    if (this.props.colorIndex == null) {
      actualColorIndex++;
      if (actualColorIndex >= maxColors) {
        actualColorIndex = 0;
      }
    } else {
      colorInd = this.props.colorIndex;
    }
    colorInd = colorInd % maxColorsMod;

    let res = (
      <ChartistGraph
        listener={{ draw: this.chartListener.bind(this, data), created: this.chartListenerCreated.bind(this, data) }}
        className={'lineColor lineColor' + colorInd}
        data={dataChart}
        type={isBar ? 'Bar' : 'Line'}
        options={options}
      />
    );

    if (!noTitles && data.title) {
      return (
        <div style={{ position: 'relative' }}>
          {helpIcontopRight}
          <div
            style={{
              textAlign: 'center',
              color: '#d1e4f5',
              fontFamily: 'Matter',
              fontSize: 13,
              fontWeight: 'bold',
            }}
            className={'ct-chartist-title-top'}
          >
            {data.title}
          </div>
          {res}
        </div>
      );
    } else {
      return (
        <div style={{ position: 'relative' }}>
          {helpIcontopRight}
          {res}
        </div>
      );
    }
  };

  chartListenerCreated = (dataOri, context) => {
    dataOri?.lines?.some((line1) => {
      let calcX = (v1) => {
        return context.chartRect.x1 + ((context.chartRect.x2 - context.chartRect.x1) / (context.axisX.range.max - context.axisX.range.min)) * (v1 - context.axisX.range.min);
      };
      let calcY = (v1) => {
        return context.chartRect.y1 + ((context.chartRect.y2 - context.chartRect.y1) / (context.axisY.range.max - context.axisY.range.min)) * (v1 - context.axisY.range.min);
      };

      let targetLine = { x1: calcX(line1[0]), y1: calcY(line1[1]), x2: calcX(line1[2]), y2: calcY(line1[3]) };
      context.svg.elem('line', targetLine, 'ct-line-line2');
    });
  };

  chartListener = (dataOri, data) => {
    if (dataOri?.onClickChart != null) {
      if (data.type === 'point' && data?.element?._node != null) {
        data.element._node.onclick = (e) => {
          dataOri.onClickChart(data, e);
        };
      }
    }

    if (dataOri.customPoints) {
      if (data.type === 'point') {
        let classCol = '';
        if (dataOri?.dotColorClassByIndex != null) {
          classCol = dataOri?.dotColorClassByIndex?.(data) || '';
        }

        let circle = new Chartist.Svg(
          'circle',
          {
            cx: [data.x],
            cy: [data.y],
            r: [data?.pointWidth ?? dataOri?.pointWidth ?? 4],
          },
          'ct-circle ' + classCol,
        );

        if (dataOri?.onClickChart != null && circle?._node != null) {
          circle._node.onclick = (e) => {
            dataOri.onClickChart(data, e);
          };
        }

        data.element.replace(circle);
      }
    }
  };

  createLine = async (chId, title, data, colorIndex, isDate = false, dataOri = null) => {
    if (!this.refs[chId]) {
      return;
    }

    let res2 = null;
    await Promise.all([import('@amcharts/amcharts4/core'), import('@amcharts/amcharts4/charts'), import('@amcharts/amcharts4/themes/moonrisekingdom'), import('@amcharts/amcharts4/themes/dark')])
      .then((modules) => {
        const am4core: any = modules[0];
        const am4charts: any = modules[1];
        const am4themes_light: any = modules[2].default;
        const am4themes_dark: any = modules[3].default;

        if (!alreadyUsedDarkModeSet) {
          alreadyUsedDarkModeSet = true;
          am4core.unuseAllThemes();
          am4core.useTheme(Utils.isDark() ? am4themes_dark : am4themes_light);
        }

        am4core.options.commercialLicense = true;

        let color = Utils.getColorPaletteByIndex(colorIndex || 0);

        let nicer = !!this.props.nicer || !!dataOri.nicer;

        let chart = am4core.create(this.refs[chId] as any, am4charts.XYChart);
        chart.width = am4core.percent(98);
        chart.height = this.props.height || 150;

        chart.fontSize = 12;
        chart.data = data;

        if (title && title !== '' && !this.props.noTitles) {
          chart.titles.template.fontSize = dataOri?.titleFontSize || 12;
          chart.titles.template.textAlign = 'middle';
          chart.titles.template.isMeasured = true;
          // chart.titles.template.fill = am4core.color('#fff');
          let title1 = chart.titles.create();
          title1.text = title;
          title1.paddingBottom = 12;
        }

        chart.padding(dataOri.paddingTop ?? 20, 5, 2, 5);

        let isBar = this.props.type === 'bar' || dataOri.chartType === 'bar';
        let dateAxis = chart.xAxes.push(isBar ? new am4charts.CategoryAxis() : isDate ? new am4charts.DateAxis() : new am4charts.ValueAxis());

        if (isBar) {
          // @ts-ignore
          let dateAxisBar = dateAxis as am4charts.CategoryAxis;
          dateAxisBar.dataFields.category = 'x';
          // dateAxisBar.renderer.grid.template.location = 0;
          // dateAxisBar.renderer.minGridDistance = 30;

          if (dataOri.useSmallBars) {
            // columnTemplate.width = am4core.percent(100);
            dateAxisBar.renderer.cellStartLocation = 0.1;
            dateAxisBar.renderer.cellEndLocation = 0.9;
          }

          // dateAxisBar.renderer.labels.template.adapter.add("dy", function(dy, target) {
          //   if (target.dataItem && (target.dataItem.index & 2) == 2) {
          //     return dy + 25;
          //   }
          //   return dy;
          // });
          // let label = dateAxisBar.renderer.labels.template;
          // label.truncate = true;
          // label.maxWidth = 120;
          if (dataOri?.doRotate) {
            dateAxisBar.events.on('sizechanged', function (ev) {
              let axis = ev.target;
              let cellWidth = axis.pixelWidth / (axis.endIndex - axis.startIndex);
              if (cellWidth < 80) {
                axis.renderer.labels.template.rotation = -45;
                axis.renderer.labels.template.horizontalCenter = 'right';
                axis.renderer.labels.template.verticalCenter = 'middle';
              } else {
                axis.renderer.labels.template.rotation = 0;
                axis.renderer.labels.template.horizontalCenter = 'middle';
                axis.renderer.labels.template.verticalCenter = 'top';
              }
            });
          } else {
            let label = dateAxisBar.renderer.labels.template;
            label.truncate = true;

            dateAxisBar.events.on('sizechanged', function (ev) {
              let axis = ev.target;
              let cellWidth = axis.pixelWidth / (axis.endIndex - axis.startIndex);
              axis.renderer.labels.template.maxWidth = cellWidth * 1.5;
            });
          }
        }
        if (dataOri.forceToPrintAllLabels) {
          dateAxis.renderer.minGridDistance = 5;
        }
        if (dataOri.drawLineX != null) {
          let range = dateAxis.axisRanges.create();
          range.value = dataOri.drawLineX;
          range.grid.stroke = am4core.color('#2e547f');
          range.grid.strokeWidth = 2;
          range.grid.strokeOpacity = 1;
        }

        if (this.props.noTitles || dataOri.titleX == null) {
          dateAxis.renderer.line.disabled = true;
          dateAxis.renderer.labels.template.disabled = true;
          dateAxis.renderer.grid.template.disabled = true;
        } else if (dataOri.useTitles && dataOri.titleX) {
          dateAxis.title.text = dataOri.titleX;
        }
        // dateAxis.renderer.grid.template.disabled = true;
        // dateAxis.renderer.labels.template.disabled = true;
        //            dateAxis.startLocation = 0;
        //            dateAxis.endLocation = 1;
        dateAxis.cursorTooltipEnabled = false;

        let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());

        if (this.props.axisYMin != null) {
          valueAxis.min = this.props.axisYMin;
          valueAxis.max = 1;
          valueAxis.strictMinMax = true;
        }
        if (this.props.axisYMax != null) {
          valueAxis.max = this.props.axisYMax;
          valueAxis.strictMinMax = true;
        }

        if (this.props.noTitles || dataOri.titleY == null) {
          valueAxis.renderer.line.disabled = true;
          valueAxis.renderer.labels.template.disabled = true;
          valueAxis.renderer.grid.template.disabled = true;
        } else if (dataOri.useTitles && dataOri.titleY) {
          valueAxis.title.text = dataOri.titleY;
        }
        valueAxis.cursorTooltipEnabled = false;

        chart.cursor = new am4charts.XYCursor();
        chart.cursor.lineY.disabled = true;

        let ss = ['y'];
        if (dataOri.seriesY != null) {
          ss = dataOri.seriesY || ['y'];
        }

        ss.some((sy1, sy1ind) => {
          let series = chart.series.push(isBar ? new am4charts.ColumnSeries() : new am4charts.LineSeries());
          if (isBar) {
            // @ts-ignore
            let seriesCol = series as am4charts.ColumnSeries;
            seriesCol.tooltipText = _.trim((sy1 || '') + ' {categoryX}: [bold]{valueY}[/]');
            seriesCol.fillOpacity = 0.8;
            seriesCol.strokeOpacity = 1;
            seriesCol.strokeWidth = 2;
            if (dataOri.seriesY != null) {
              seriesCol.name = sy1;
            }

            // if(dataOri.useSmallBars) {
            // seriesCol.columns.template.width = am4core.percent(90);
            // seriesCol.sequencedInterpolation = true;
            // }
            // seriesCol.columns.template.tooltipText = "{categoryX}: [bold]{valueY}[/]";
            // seriesCol.columns.template.fillOpacity = 0.8;
            // let columnTemplate = seriesCol.columns.template;
            // columnTemplate.strokeWidth = 2;
            // columnTemplate.strokeOpacity = 1;
          } else {
            series.tooltipText = '[bold]{valueY}';
          }
          if (isBar) {
            series.dataFields.categoryX = 'x';
          } else if (isDate) {
            series.dataFields.dateX = 'x';
          } else {
            series.dataFields.valueX = 'x';
          }
          series.dataFields.valueY = sy1 || 'y';
          if (nicer) {
            // @ts-ignore
            series.tensionX = 0.8;
          }
          if (!isBar) {
            series.strokeWidth = 2;
            series.stroke = color;
          }
          series.end = 1;

          let useColorForce;
          if (this.props.colorIndex != null) {
            let ind1 = (this.props.colorIndex + sy1ind) % maxColorsMod;
            useColorForce = this.calcColorFromIndex(ind1);
          }
          if (this.props.startColorIndex != null) {
            let ind1 = (this.props.startColorIndex + sy1ind) % maxColorsMod;
            useColorForce = this.calcColorFromIndex(ind1);
          }
          if (useColorForce != null) {
            series.fill = am4core.color(useColorForce);
            series.stroke = am4core.color(useColorForce).lighten(-0.3);
          }

          if (dataOri?.barEachColor && ss?.length === 1) {
            if (this.props.startColorIndex != null) {
              let ind1 = (this.props.startColorIndex + sy1ind) % maxColorsMod;
              series.columns.template.adapter.add('fill', (fill, target) => {
                return am4core.color(this.calcColorFromIndex((ind1 + target.dataItem.index) % maxColorsMod));
              });
            }
          }

          if (dataOri.isScatter) {
            series.strokeOpacity = 0;
            let bulletScatter = series.bullets.push(new am4charts.CircleBullet());
            bulletScatter.circle.fill = am4core.color('#f00');
            bulletScatter.circle.radius = 3;
          }

          if (nicer) {
            // render data points as bullets
            let bullet = series.bullets.push(new am4charts.CircleBullet());
            bullet.circle.opacity = 0;
            bullet.circle.fill = color;
            bullet.circle.propertyFields.opacity = 'opacity';
            bullet.circle.radius = 3;
          }
        });

        if (dataOri.useLegend) {
          chart.legend = new am4charts.Legend();
        }

        res2 = chart;
      })
      .catch((e) => {
        Utils.error('Error when creating chart');
        Utils.error(e);
      });

    return res2;
  };

  createLineEC = (title, data, colorIndex, isDate = false, dataOri = null) => {
    let color = Utils.getColorPaletteByIndex(colorIndex || 0);

    let isHeatmap = this.props.type === 'heatmap';

    let chart: EChartsOption = {
      backgroundColor: 'transparent',
      responsive: true,
      animation: false,
      maintainAspectRatio: false,
      grid: {
        right: 18,
        top: 25,
        bottom: 40,
        left: 40,

        containLabel: false,
      },
    };

    if (this.props.noTitles) {
      let g1 = chart.grid as any;
      g1.right = 0;
      g1.left = 0;
      g1.top = 0;
      g1.bottom = 0;
    }

    if (isHeatmap) {
      chart = _.assign(chart, data.data || {});
    }

    if (dataOri.gridContainLabel && chart.grid != null) {
      (chart.grid as any).containLabel = true;
    }

    chart.textStyle = { fontSize: 12 };
    // chart.data = data;

    if (title && title !== '' && !this.props.noTitles) {
      let titleUse = title;
      if (!Utils.isNullOrEmpty(dataOri?.subtitle)) {
        titleUse += '\n\n' + dataOri?.subtitle;
        if (chart.grid) {
          (chart.grid as any).top += 30;
        }
      }

      chart.title = {
        show: true,
        textStyle: _.assign(
          {
            fontSize: dataOri?.titleFontSize || 12,
          },
          dataOri?.titleStyle || {},
        ),
        text: titleUse,
        left: 'center',
      };
      if (!isHeatmap) {
        (chart.grid as any).top += 16;
      }
      // chart.titles.template.textAlign = "middle";
      // chart.titles.template.isMeasured = true;
    }

    // chart.padding(dataOri.paddingTop ?? 20, 5, 2, 5);

    let autoXAxisMinMax = false;

    const isBreakdown = dataOri.breakdown != null;

    let isBar = this.props.type === 'bar' || dataOri.chartType === 'bar' || dataOri.isBar === true;
    let isBarHor = this.props.type === 'barhor';
    let isBarVert = this.props.type === 'barvert';
    let isPie = this.props.type === 'pie';
    let isBarStack = this.props.type === 'barstack';

    if (isBarStack || isBarHor || isBarVert) {
      isBar = true;
    }

    let dateAxis: any = {};
    if (isBar) {
      const maxCharsOri = dataOri?.labelMaxChars;

      const maxChars = maxCharsOri ?? 5;
      dateAxis = {
        type: (isBarVert ? 'value' : null) ?? dataOri.dateAxisType ?? 'category',
        axisLabel: {
          interval: dataOri?.intervalX === null ? undefined : dataOri?.intervalX ?? 0,
          showMaxLabel: true,
          formatter: (v1) => (v1?.length > (maxCharsOri ?? 10) ? v1.substring(0, maxCharsOri ?? 10) + '...' : v1),
        },
      };
      if (data?.length >= 4) {
        dateAxis.axisLabel.formatter = (v1) => (v1?.length > maxChars ? v1.substring(0, maxChars) + '...' : v1);
      }
      if (this.props.verticalXAxisLabels && data?.length >= 20) {
        dateAxis.axisLabel.rotate = 90;
        dateAxis.axisLabel.hideOverlap = true;
      }
    } else if (isDate) {
      dateAxis = {
        type: 'time',
        axisLabel: {
          formatter: {
            day: Utils.isDayFirstOnDate() ? '{d}/{M}' : '{M}/{d}',
          },
        },
      };
    } else {
      autoXAxisMinMax = true;
      dateAxis = {
        type: dataOri?.typeAxisType ?? 'value',
      };
    }
    if (this.props.noGrid) {
      dateAxis.splitLine = dateAxis.splitLine || {};
      dateAxis.splitLine.show = false;
      dateAxis.show = false;
    }

    if (dataOri.xAxisSplitLine != null) {
      dateAxis.splitLine = dateAxis.splitLine ?? {};
      dateAxis.splitLine = _.assign(dateAxis.splitLine, dataOri.xAxisSplitLine);
    }

    this.xAxisValues = null;
    if (isBar) {
      let dd = dataOri.barXValues === null ? undefined : data?.map((d1) => d1.x) || [];
      this.xAxisValues = dd;
      if (dd !== undefined) {
        dateAxis.data = dd;
      }
    } else if (dataOri?.serieX != null) {
      dateAxis.type = 'value';
    }
    if (dataOri?.dataAxisX != null) {
      dateAxis.data = dataOri?.dataAxisX;
    }
    if (dataOri?.dataAxisXformatter != null) {
      dateAxis.axisLabel ??= {};
      dateAxis.axisLabel.formatter = (v1) => dataOri?.dataAxisXformatter?.(v1);
    }

    let titleX = dataOri.titleX;
    if (isBreakdown && !titleX) {
      titleX = '(Click on a bar to see breakdown)';
    }
    if (this.props.noTitles || titleX == null) {
      if (dateAxis.axisLabel == null) {
        dateAxis.axisLabel = {};
      }
      dateAxis.axisLabel.show = false;
    } else if (dataOri.useTitles && titleX) {
      dateAxis.name = titleX;
      dateAxis.nameLocation = 'middle';
      const esp = this.props.verticalXAxisLabels ? 52 : 32;
      dateAxis.nameGap = esp + (isBreakdown ? 20 : 0);
      (chart.grid as any).top -= 0;
      (chart.grid as any).bottom += 20 + (isBreakdown ? 10 : 0);
    }

    if (dataOri.gridColor && !isHeatmap) {
      dateAxis.splitLine = dateAxis.splitLine || {};
      dateAxis.splitLine.lineStyle = dateAxis.splitLine.lineStyle || {};
      dateAxis.splitLine.lineStyle.color = dataOri.gridColor;

      dateAxis.lineStyle = dateAxis.lineStyle || {};
      dateAxis.lineStyle.color = dataOri.gridColor;

      dateAxis.axisLine = dateAxis.axisLine || {};
      dateAxis.axisLine.lineStyle = dateAxis.axisLine.lineStyle || {};
      dateAxis.axisLine.lineStyle.color = dataOri.gridColor;

      dateAxis.axisTick = dateAxis.axisTick || {};
      dateAxis.axisTick.lineStyle = dateAxis.axisTick.lineStyle || {};
      dateAxis.axisTick.lineStyle.color = dataOri.gridColor;
    }

    if (dataOri?.labelColor) {
      dateAxis.axisLabel = dateAxis.axisLabel || {};
      dateAxis.axisLabel.color = dataOri.labelColor;
    }

    dateAxis.triggerEvent = true;

    if (!isHeatmap) {
      chart.xAxis = dateAxis;
    }

    let valueAxis: any = {
      type: (isBarVert ? 'category' : null) ?? dataOri.axis1type ?? 'value',
    };
    if (dataOri.axis1typeData != null) {
      valueAxis.data = dataOri.axis1typeData;
    }
    if (this.props.noGrid) {
      valueAxis.splitLine = valueAxis.splitLine || {};
      valueAxis.splitLine.show = false;
      valueAxis.show = false;
    } else if (!isHeatmap && !isPie) {
      chart.tooltip = {
        show: true,
        trigger: 'axis',
        appendToBody: true,
      };
    }
    if (isPie) {
      chart.tooltip = {
        show: true,
        trigger: 'item',
        appendToBody: true,
      };
    }
    if (isBarStack || isBarHor || isBarVert) {
      chart.tooltip = {
        show: true,
        trigger: 'axis',
        appendToBody: true,
      };
    }

    if (dataOri.gridColor && !isHeatmap) {
      valueAxis.splitLine = valueAxis.splitLine || {};
      valueAxis.splitLine.lineStyle = valueAxis.splitLine.lineStyle || {};
      valueAxis.splitLine.lineStyle.color = dataOri.gridColor;

      valueAxis.lineStyle = valueAxis.lineStyle || {};
      valueAxis.lineStyle.color = dataOri.gridColor;

      valueAxis.axisLine = valueAxis.axisLine || {};
      valueAxis.axisLine.lineStyle = valueAxis.axisLine.lineStyle || {};
      valueAxis.axisLine.lineStyle.color = dataOri.gridColor;

      valueAxis.axisTick = valueAxis.axisTick || {};
      valueAxis.axisTick.lineStyle = valueAxis.axisTick.lineStyle || {};
      valueAxis.axisTick.lineStyle.color = dataOri.gridColor;
    }

    if (dataOri.axisYMin != null) {
      valueAxis.min = dataOri.axisYMin;
    }
    if (this.props.axisYMin != null) {
      valueAxis.min = this.props.axisYMin;
      if (!this.props.noMax) {
        valueAxis.max = 1;
      }
    }
    if (this.props.axisYMax != null) {
      valueAxis.max = this.props.axisYMax;
    }

    if (dataOri?.labelColor) {
      valueAxis.axisLabel = valueAxis.axisLabel || {};
      valueAxis.axisLabel.color = dataOri.labelColor;
    }

    if (this.props.noTitles || dataOri.titleY == null) {
      if (valueAxis.axisLabel == null) {
        valueAxis.axisLabel = {};
      }
      valueAxis.axisLabel.show = false;
    } else if (dataOri.useTitles && dataOri.titleY) {
      valueAxis.name = dataOri.titleY;
      valueAxis.nameLocation = 'middle';
      const esp = 44 + (dataOri.axis1Gap || 0);
      valueAxis.nameGap = esp;
      (chart.grid as any).right += 10;
      (chart.grid as any).left += 30 + (dataOri.axis1Gap || 0);

      (chart.grid as any).bottom += 10;
    }
    if (dataOri.yAxisNoGap) {
      valueAxis.max = 'dataMax';
    }
    if (dataOri.yAxisMaxList?.[0] != null) {
      valueAxis.max = dataOri.yAxisMaxList?.[0];
    }
    if (dataOri.yAxisMinList?.[0] != null) {
      valueAxis.min = dataOri.yAxisMinList?.[0];
    }
    if (dataOri.axisYdecimals != null || dataOri.axisY1decimals != null) {
      valueAxis.axisLabel = valueAxis.axisLabel ?? {};
      valueAxis.axisLabel.formatter = (value, index) => {
        return Utils.decimals(value, dataOri.axisYdecimals ?? dataOri.axisY1decimals, true);
      };
    }
    if (dataOri?.axisXstepSize != null) {
      valueAxis.ticks ??= {};
      valueAxis.ticks.stepSize = dataOri.axisXstepSize;
    }

    if (dataOri.gapAxisLeft != null) {
      (chart.grid as any).left += dataOri.gapAxisLeft;
    }

    let valueAxis2: any = null;
    if (dataOri.useTwoYAxis != null) {
      let ind2 = dataOri.axis2index ?? (dataOri.yAxisMaxList == null ? null : dataOri.yAxisMaxList.length - 1);

      valueAxis2 = {
        type: dataOri.axis2type ?? 'value',
      };
      if (this.props.noGrid) {
        valueAxis2.splitLine = valueAxis2.splitLine || {};
        valueAxis2.splitLine.show = false;
        valueAxis2.show = false;
      }
      if (dataOri.gridColor && !isHeatmap) {
        valueAxis2.splitLine = valueAxis2.splitLine || {};
        valueAxis2.splitLine.lineStyle = valueAxis2.splitLine.lineStyle || {};
        valueAxis2.splitLine.lineStyle.color = dataOri.gridColor;

        valueAxis2.lineStyle = valueAxis2.lineStyle || {};
        valueAxis2.lineStyle.color = dataOri.gridColor;

        valueAxis2.axisLine = valueAxis2.axisLine || {};
        valueAxis2.axisLine.lineStyle = valueAxis2.axisLine.lineStyle || {};
        valueAxis2.axisLine.lineStyle.color = dataOri.gridColor;

        valueAxis2.axisTick = valueAxis2.axisTick || {};
        valueAxis2.axisTick.lineStyle = valueAxis2.axisTick.lineStyle || {};
        valueAxis2.axisTick.lineStyle.color = dataOri.gridColor;
      }

      if (dataOri?.labelColor) {
        valueAxis2.axisLabel = valueAxis2.axisLabel || {};
        valueAxis2.axisLabel.color = dataOri.labelColor;
      }

      if (this.props.noTitles || dataOri.titleY2 == null) {
        if (valueAxis2.axisLabel == null) {
          valueAxis2.axisLabel = {};
        }
        valueAxis2.axisLabel.show = false;
      } else if (dataOri.useTitles && dataOri.titleY2) {
        valueAxis2.name = dataOri.titleY2;
        valueAxis2.nameLocation = 'middle';
        const esp = 44 + (dataOri.axis2Gap || 0);
        valueAxis2.nameGap = esp;
        (chart.grid as any).right += 30 + (dataOri.axis2Gap || 0);
        (chart.grid as any).left += 10;
      }
      if (dataOri.yAxisNoGap) {
        valueAxis2.max = 'dataMax';
      }
      if (ind2 != null && dataOri.yAxisMaxList?.[ind2] != null) {
        valueAxis2.max = dataOri.yAxisMaxList?.[ind2];
      }
      if (ind2 != null && dataOri.yAxisMinList?.[ind2] != null) {
        valueAxis2.min = dataOri.yAxisMinList?.[ind2];
      }
      if (dataOri.axisYdecimals != null) {
        valueAxis2.axisLabel = valueAxis2.axisLabel ?? {};
        valueAxis2.axisLabel.formatter = (value, index) => {
          return Utils.decimals(value, dataOri.axisYdecimals, true);
        };
      }
    }

    if (!isHeatmap) {
      if (valueAxis2 == null) {
        chart.yAxis = valueAxis;
      } else {
        chart.yAxis = [valueAxis, valueAxis2];
      }
    }

    if (dataOri.topSpace != null) {
      chart.grid = chart.grid ?? {};
      (chart.grid as any).top += dataOri.topSpace;
    }

    if (dataOri.useUTC != null) {
      chart.useUTC = dataOri.useUTC;
    }

    if (dataOri.sameMaxXY != null) {
      let maxX, maxY;
      data?.map((d1) => {
        let x1 = d1?.[dataOri.sameMaxXY[0]];
        let y1 = d1?.[dataOri.sameMaxXY[1]];

        if (maxX == null || x1 > maxX) {
          maxX = x1;
        }
        if (maxY == null || y1 > maxY) {
          maxY = y1;
        }
      });
      if (maxX != null && maxY != null) {
        dateAxis.max = maxX * 1;
        valueAxis.max = maxY * 1;
      }
    }

    if (dataOri.dataZoomX) {
      chart.dataZoom = {
        type: 'slider',
      };
      (chart.grid as any).bottom += 30;
    }

    let fieldX = 'x';
    let ss = ['y'];
    if (dataOri.seriesY != null) {
      ss = dataOri.seriesY || ['y'];
    }

    let xMax = null,
      xMin = null;

    const dateOnTooltip = dataOri.dateOnTooltip;
    const fieldNameTooltip = dataOri.fieldNameTooltip;
    const tooltipFormatExt = dataOri.tooltipFormatExt;
    const tooltipSeriesInvert = dataOri.tooltipSeriesInvert === true;
    if (fieldNameTooltip || dataOri?.tooltipConvertValue != null || dataOri.maxDecimalsTooltip != null || (dataOri.tooltips != null && _.isArray(dataOri.tooltips) && dataOri.tooltips.length > 0)) {
      chart.tooltip = {
        trigger: 'axis',
        formatter: function (params) {
          if (dataOri?.tooltipRender != null) {
            return dataOri.tooltipRender(params);
          }

          let paramsOri = params;
          if (_.isArray(params)) {
            params = params[0];
          } else if (paramsOri != null && !_.isArray(paramsOri)) {
            paramsOri = [paramsOri];
          }

          const encFast = (value) => {
            if (value == null) {
              return '';
            } else {
              const max = 120;
              if (_.isString(value) && value?.length > max) {
                value = value.substring(0, max) + '...';
              }
              return Utils.encode(value, false);
            }
          };

          let dateP1 = '';
          if (dateOnTooltip === true) {
            let dt1 = params.axisValue;

            let isDtDate = false;
            if (dataOri?.serieX != null) {
              if (dt1) {
                if (_.isNumber(dt1)) {
                  dateP1 = Utils.decimals(dt1, dataOri.axisXdecimals ?? 4);
                } else {
                  dateP1 = dt1;
                }
              }
            } else {
              if (_.isNumber(dt1)) {
                let m1 = moment.unix(dt1 / (dataOri.dateOnTooltipDiv ?? 1));
                if (m1.isValid()) {
                  if (!dataOri.dateOnTooltipNonUTC) {
                    m1 = m1.tz('UTC', false);
                  }
                  dateP1 = m1.format('LLL');
                  isDtDate = true;
                }
              } else if (_.isString(dt1) && dt1) {
                let m1 = moment(dt1);
                if (m1.isValid()) {
                  if (!dataOri.dateOnTooltipNonUTC) {
                    m1 = m1.tz('UTC', false);
                  }
                  dateP1 = m1.format('LLL');
                  isDtDate = true;
                }
              }
            }

            if (dateP1 !== '' && !dataOri.dateOnTooltipNonUTC && isDtDate) {
              dateP1 += ' (UTC)';
            }
            if (dateP1 !== '') {
              dateP1 += '<br />';
            }
          }

          return (
            dateP1 +
            '' +
            (dataOri?.tooltipValueLabel ?? '') +
            (dataOri?.tooltipValueLabelByParams?.(params) ?? '') +
            params?.name +
            '<br/>' +
            (tooltipSeriesInvert ? paramsOri?.reverse() : paramsOri)
              ?.map((p1, p1ind0) => {
                let p1ind = tooltipSeriesInvert ? paramsOri.length - 1 - p1ind0 : p1ind0;
                if (dataOri?.useLegendSeriesIndex) {
                  p1ind = p1.seriesIndex;
                }

                let fieldNameTooltipS = fieldNameTooltip?.[p1ind + (dataOri?.fieldNameTooltipAddIndex ?? 0)];
                if (fieldNameTooltipS === null) {
                  return null;
                }
                const t1 = dataOri.tooltips?.[p1.dataIndex]?.[p1ind];
                let v1 = t1 ?? p1.value;
                if (t1 == null && v1 != null && _.isArray(v1)) {
                  v1 = v1[v1.length - 1];
                }
                if (t1 == null && dataOri.maxDecimalsTooltip != null && _.isNumber(v1)) {
                  if (tooltipFormatExt != null) {
                    v1 = tooltipFormatExt(v1, p1ind);
                  } else {
                    v1 = Utils.decimals(v1, dataOri.maxDecimalsTooltip);
                  }
                }
                let color1 = p1.color;
                if (color1 == null || color1 === '' || !_.isString(color1)) {
                  color1 = p1.color?.colorStops?.[0]?.color;
                }

                if (dataOri?.tooltipConvertValue != null) {
                  v1 = dataOri.tooltipConvertValue(v1);
                }

                return (
                  '<span style="display: inline-block; width:10px;height:10px;border-radius: 50%; vertical-align: middle; margin-right: 4px; background: ' +
                  encFast(color1) +
                  ';"></span>' +
                  encFast(fieldNameTooltipS ?? p1.seriesName) +
                  ': ' +
                  encFast(v1)
                );
              })
              ?.filter((v1) => v1 != null)
              ?.join('<br />')
          );
        },
      };
    }

    this.onClickChart = dataOri.onClickChart;

    if (dataOri.breakdown != null) {
      let breakdown: { id: any[]; names: any[]; values: any[] } = dataOri.breakdown;
      this.breakdown = breakdown;
      this.breakdownDoExportFG = dataOri.exportFG;
      this.breakdownButtons = dataOri.breakdownButtons;
      this.breakdownSort = dataOri.breakdownSort;
      dateAxis.axisLabel = dateAxis.axisLabel || {};
      dateAxis.axisLabel.formatter = (value, index) => {
        return '{a|(Items Ids)}\n' + value;
      };
      dateAxis.axisLabel.rich = {
        a: {
          color: '#1890ff',
        },
      };
      dateAxis.axisLabel.lineHeight = 17;
      (chart.grid as any).bottom += 10;
    }

    const textMax = (v1) => {
      const max = 120;
      if (v1 != null && _.isString(v1) && v1.length > max) {
        v1 = v1.substring(0, max) + '...';
      }
      return v1;
    };

    let seriesList = [];
    ss.some((sy1, sy1ind) => {
      let series: any = {};

      if (dataOri.useLegend && dataOri.fieldNameTooltip?.[sy1ind] != null) {
        series.name = textMax(dataOri.fieldNameTooltip?.[sy1ind]);
      }

      if (dataOri.legendNames?.[sy1ind] != null) {
        series.name = textMax(dataOri.legendNames?.[sy1ind]);
      }

      if (dataOri.lineStyleType?.[sy1ind] != null) {
        series.lineStyle = series.lineStyle || {};
        series.lineStyle.type = dataOri.lineStyleType?.[sy1ind];
      }

      if (valueAxis2 != null && dataOri.useTwoYAxis?.[sy1ind] === true) {
        series.yAxisIndex = 1;
      }

      if (sy1ind === 0 && dataOri.xAxisLines != null && _.isArray(dataOri.xAxisLines)) {
        series.markLine = {
          symbol: ['none', 'none'],
          label: { show: false },
          silent: true,
          lineStyle: {
            color: 'rgba(255,255,255,0.1)',
          },
          data: dataOri.xAxisLines.map((x1, x1ind) => ({ xAxis: x1 })),
        };
      }

      let useColors: { from: string; to: string }[] = null;
      if (this.props.colorFixed != null && _.isArray(this.props.colorFixed)) {
        useColors = this.props.colorFixed as any;
      }
      if (isPie && useColors != null) {
        if (_.isArray(useColors) && useColors?.[0]?.from != null) {
          series.color = useColors?.map((c1) => c1?.from);
        } else {
          series.color = useColors;
        }
      }

      const maxC = useColors == null ? maxColorsMod : useColors.length;

      let useColorForce;
      if (this.props.colorIndex != null) {
        let ind1 = (this.props.colorIndex + sy1ind) % maxC;
        if (dataOri.forceColorIndex != null && dataOri.forceColorIndex[sy1ind] != null) {
          ind1 = dataOri.forceColorIndex[sy1ind];
        }
        let useColors2 = useColors;
        if (this.props.colorFixedAndMore != null && useColors != null) {
          if (useColors?.[this.props.colorIndex + sy1ind] == null) {
            useColors2 = null;
            ind1 = this.props.colorFixedAndMore + this.props.colorIndex + sy1ind;
          }
        }
        useColorForce = useColors2 == null ? this.calcColorFromIndex(ind1) : useColors[ind1];
      }
      if (this.props.startColorIndex != null) {
        let ind1 = (this.props.startColorIndex + sy1ind) % maxC;
        if (dataOri.forceColorIndex != null && dataOri.forceColorIndex[sy1ind] != null) {
          ind1 = dataOri.forceColorIndex[sy1ind];
        }
        let useColors2 = useColors;
        if (this.props.colorFixedAndMore != null && useColors != null) {
          if (useColors?.[this.props.startColorIndex + sy1ind] == null) {
            useColors2 = null;
            ind1 = this.props.colorFixedAndMore + this.props.startColorIndex + sy1ind;
          }
        }
        useColorForce = useColors2 == null ? this.calcColorFromIndex(ind1) : useColors[ind1];
      }
      if (this.props.colorFixed != null && _.isString(this.props.colorFixed)) {
        useColorForce = this.props.colorFixed;
      }
      if (this.props.colorFixed != null && !_.isArray(this.props.colorFixed) && _.isObject(this.props.colorFixed)) {
        useColorForce = this.props.colorFixed;
      }
      if (useColorForce != null && !isPie) {
        if (_.isString(useColorForce)) {
          series.color = useColorForce;
        } else {
          series.color = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: useColorForce.from },
            { offset: 1, color: useColorForce.to },
          ]);
        }
      }
      if (dataOri?.roundBars) {
        series.itemStyle = series.itemStyle || {};
        series.itemStyle.borderRadius = this.props.axisYMin == null || this.props.axisYMin >= 0 ? [8, 8, 0, 0] : 3;
      }
      if (dataOri?.barMaxWidth) {
        series.barMaxWidth = dataOri.barMaxWidth;
      }
      if (dataOri?.barGap) {
        series.barGap = dataOri.barGap;
      }
      if (dataOri?.barWidth) {
        series.barWidth = dataOri.barWidth;
      }

      if (this.props.startColor && this.props.endColor) {
        series.color = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: this.props.startColor },
          { offset: 1, color: this.props.endColor },
        ]);
      }

      if (isBar) {
        series.type = 'bar';
        if (isBarStack) {
          series.stack = 'total';
        }
        let seriesCol = series;
        if (dataOri.seriesY != null) {
          seriesCol.name = sy1;
        }
      } else if (isPie) {
        series.type = 'pie';
        series.radius = dataOri?.pieRadius ?? ['34%', '70%'];
        series.center = ['50%', '50%'];

        series.emphasis = {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        };

        series.data = data;

        if (dataOri?.pieNoLines) {
          series.label ??= {};
          series.label = {
            show: false,
            position: 'center',
          };
          series.labelLine ??= {};
          series.labelLine = {
            show: false,
          };
        }
      } else {
        series.type = 'line';
        series.showSymbol = false;

        if (this.props.lineFilled) {
          series.areaStyle = series.areaStyle || {};
          series.areaStyle.color = useColorForce ?? color;
        }
      }

      let fieldY = sy1 || 'y';
      if (dataOri?.dataAxisXSerie1 != null) {
        series.data = dataOri?.dataAxisXSerie1;
      } else if (fieldY && !isHeatmap && !isPie) {
        if (dataOri?.seriesOnlyY === true) {
          series.data = data?.map((d1, d1ind) => {
            let y1 = d1?.[fieldY];
            return y1;
          });
        } else if (isBar) {
          if (isBarStack || isBarHor) {
            series.data = [data?.[sy1ind]?.[sy1]];
            if (dataOri.gridContainLabel) {
              series.label = series.label ?? {};
              series.label.show = true;
            }
          } else {
            series.data = data?.map((d1) =>
              dataOri?.highlightField != null && d1?.[dataOri?.highlightField] && this.props.startHighlightColor && this.props.endHighlightColor
                ? {
                    value: d1?.[fieldY],
                    itemStyle: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: this.props.startHighlightColor },
                        { offset: 1, color: this.props.endHighlightColor },
                      ]),
                    },
                  }
                : d1?.[fieldY],
            );
          }
        } else {
          let total = 0,
            notNull = 0;
          series.data = data?.map((d1, d1ind) => {
            let x1 = d1?.[fieldX];
            if (xMax == null || x1 > xMax) {
              xMax = x1;
            }
            if (xMin == null || x1 < xMin) {
              xMin = x1;
            }

            let y1 = d1?.[fieldY];

            if (y1 != null) {
              notNull++;
            }
            total++;

            return [x1, y1];
          });

          if (total > 0 && notNull > 0 && dataOri.showSymbolPerc != null && notNull / total < dataOri.showSymbolPerc) {
            if (dataOri.symbol != null && _.isArray(dataOri.symbol) && dataOri.symbol?.[sy1ind] != null) {
              series.symbolSize = dataOri.symbolSize?.[0] ?? 10;
              series.symbol = dataOri.symbol?.[sy1ind];
              series.showSymbol = true;
            }
          }
        }
      }

      if (!isBar) {
        series.lineStyle = series.lineStyle || {};
        series.lineStyle.width = 2;
        series.lineStyle.color = useColorForce ?? color;
      }

      if (dataOri?.barEachColor && ss?.length === 1 && !isHeatmap && !isPie) {
        if (this.props.startColorIndex != null) {
          let useColors: { from: string; to: string }[] = null;
          if (this.props.colorFixed != null && _.isArray(this.props.colorFixed)) {
            useColors = this.props.colorFixed as any;
          }

          const maxC = useColors == null ? maxColorsMod : useColors.length;

          let ind1 = 0;
          if (this.props.colorIndex != null) {
            ind1 = (this.props.colorIndex + sy1ind) % maxC;
          }
          if (this.props.startColorIndex != null) {
            ind1 = (this.props.startColorIndex + sy1ind) % maxC;
          }
          if (dataOri.forceColorIndex != null && dataOri.forceColorIndex[sy1ind] != null) {
            ind1 = dataOri.forceColorIndex[sy1ind];
          }

          data = data.map((d1, d1ind) => {
            let useColorForce;
            if (this.props.colorIndex != null) {
              let ind2 = (ind1 + d1ind) % maxC;
              useColorForce = useColors == null ? this.calcColorFromIndex(ind2) : useColors[ind2];
            }
            if (this.props.startColorIndex != null) {
              let ind2 = (ind1 + d1ind) % maxC;
              useColorForce = useColors == null ? this.calcColorFromIndex(ind2) : useColors[ind2];
            }
            if (this.props.colorFixed != null && _.isString(this.props.colorFixed)) {
              useColorForce = this.props.colorFixed;
            }
            if (dataOri.forceColorIndexEachBar != null && dataOri.forceColorIndexEachBar[sy1ind] != null) {
              let ind2 = dataOri.forceColorIndexEachBar[d1ind];
              useColorForce = useColors == null ? this.calcColorFromIndex(ind2) : useColors[ind2];
            }

            let c1 = this.calcColorFromIndex((ind1 + d1ind) % maxColorsMod);
            if (useColorForce != null) {
              if (_.isString(useColorForce)) {
                c1 = useColorForce;
              } else {
                c1 = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: useColorForce.from },
                  { offset: 1, color: useColorForce.to },
                ]);
              }
            }

            return { value: d1?.[fieldY], itemStyle: { color: c1 } };
          });
          series.data = data;
        }
      }

      if (dataOri.topLabels != null) {
        series.label = series.label ?? {};
        series.label.show = true;
        series.label.position = 'top';
        series.label.formatter = (params) => {
          let l1 = dataOri.topLabels?.[params?.dataIndex ?? 0];
          if (l1 == null) {
            return '';
          } else {
            return l1;
          }
        };
        series.label.rich = dataOri.topLabelsRich;
      }

      if (dataOri.symbolSizeAll != null) {
        series.symbolSize = dataOri.symbolSizeAll;
        series.symbol = 'emptyCircle';
        series.showSymbol = true;
      }

      seriesList.push(series);
    });

    if (xMin != null && autoXAxisMinMax) {
      dateAxis.min = xMin;
    }
    if (dataOri?.axisXmin != null) {
      dateAxis.min = dataOri?.axisXmin;
    }
    if (xMax != null && autoXAxisMinMax) {
      dateAxis.max = xMax;
    }
    if (dataOri?.axisXmax != null) {
      dateAxis.max = dataOri?.axisXmax;
    }

    if (!isHeatmap) {
      chart.series = seriesList;
    }

    chart.legend = chart.legend ?? {};
    if (dataOri.useLegend) {
      (chart.legend as any).show = true;
      (chart.legend as any).top = (dataOri?.legendTopSpace ?? 0) + 10;
      let tooManySeries = dataOri.seriesY?.length > 5;
      (chart.grid as any).top += 18 + (tooManySeries ? 30 : 0);
      if (tooManySeries) {
        (chart.legend as any).width = '74%';
      }
      if (dataOri?.legendBottomSpace != null) {
        (chart.legend as any).bottom = dataOri?.legendBottomSpace;
      }
    } else {
      (chart.legend as any).show = false;
    }

    return chart;
  };

  calcColorFromIndex = (index) => {
    index = index % maxColorsMod;

    let c1;
    if (index >= maxColors) {
      if (index < maxColors + extraColors.length) {
        c1 = extraColors[index - maxColors];
      } else {
        c1 = extraColors2[index - maxColors - extraColors.length];
      }
    } else {
      c1 = Utils.getColorPaletteByIndex(index);
    }
    return c1;
  };

  componentDidMount() {
    if (this.props?.wait > 0) {
      this.setState({ isWaitingToRender: true });

      setTimeout(() => {
        if (!this.isM) {
          return;
        }
        this.setState({ isWaitingToRender: false });
      }, this.props.wait);
    }

    this.isM = true;

    if (this.props.startColorIndex != null) {
      actualColorIndex = this.props.startColorIndex;
    }

    if (!alreadyCssInjected) {
      alreadyCssInjected = true;

      let css1 = '';
      for (let i = 0; i < maxColors + extraColors.length + extraColors2.length; i++) {
        let c1 = this.calcColorFromIndex(i) as any;
        if (_.isObject(c1)) {
          c1 = (c1 as any).from;
        }
        css1 += '.useDark .lineColor' + i + ' .ct-line { stroke: ' + c1 + '; } \n';
        css1 += '.useDark .lineColor' + i + ' .ct-bar { stroke: ' + c1 + '; } \n';
      }

      RECSS.injectCss(css1, {});
    }
  }

  componentWillUnmount() {
    this.isM = false;

    this.chartsList.some((c1) => {
      c1.dispose();
    });
    this.chartsList = [];

    if (this.confirmList != null) {
      this.confirmList.destroy();
      this.confirmList = null;
    }
  }

  render() {
    let div1 = !this.state.isWaitingToRender ? this.memData(this.props.data, this.props.width) : '';

    if (div1) {
      return div1;
    }

    return <div></div>;
  }
}

export default ChartXYExt;
