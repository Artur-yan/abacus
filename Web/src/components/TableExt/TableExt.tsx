import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import withStyles from '@mui/styles/withStyles';
import classNames from 'classnames';
import _ from 'lodash';
import * as React from 'react';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import { CellMeasurer, CellMeasurerCache } from 'react-virtualized/dist/commonjs/CellMeasurer';
import { InfiniteLoader } from 'react-virtualized/dist/commonjs/InfiniteLoader';
import { Column as ColumnVirtual, Table as TableVirtual } from 'react-virtualized/dist/commonjs/Table';
import { Waypoint } from 'react-waypoint';
import Utils, { ReactLazyExt } from '../../../core/Utils';
import memoizeOne from '../../libs/memoizeOne';
const s = require('./TableExt.module.css');
const sd = require('../antdUseDark.module.css');

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Checkbox from 'antd/lib/checkbox';
import Input from 'antd/lib/input';
import { CSSProperties } from 'react';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import NanoScroller from '../NanoScroller/NanoScroller';
import NullShow from '../NullShow/NullShow';
import TooltipExtOver from '../TooltipExtOver/TooltipExtOver';
import WindowSizeSmart from '../WindowSizeSmart/WindowSizeSmart';
// import {
//   Column,
//   ColumnChooser,
//   DataGrid, FilterBuilderPopup, FilterPanel,
//   FilterRow, HeaderFilter,
//   MasterDetail,
//   Scrolling,
//   SearchPanel
// } from "devextreme-react/data-grid";
const DevDataGrid = ReactLazyExt(() => import('./DevExt'));

// import {CellPreparedEvent, EditorPreparedEvent, RowDblClickEvent, RowPreparedEvent} from "devextreme/ui/data_grid";

type TypeField = string | string[];

export interface ITableExtColumn {
  title?: string;
  field?: TypeField;
  align?: 'left' | 'right' | 'center' | 'justify';
  render?: (text: any, row: any, index: number, isLarge: boolean) => any;
  renderSecondRow?: (text: any, row: any, index: number) => any;
  useSecondRowArrow?: boolean;
  disableSort?: boolean;
  sortField?: TypeField;
  width?: any;
  widthLessMedium?: any;
  widthLessLarge?: any;
  widthToUse?: any;
  isLinked?: boolean | ((row: any) => boolean);
  isBlueLight?: boolean | ((row: any) => boolean);
  helpId?: string;
  helpTooltip?: string;
  forceNoWrap?: boolean;

  hideLessLarge?: boolean;
  hideLessMedium?: boolean;
  hideLessSmall?: boolean;

  hideMoreLarge?: boolean;
  hideMoreMedium?: boolean;
  hideMoreSmall?: boolean;

  noLink?: boolean;
  noAutoTooltip?: boolean;

  dataType?: string;
  isNested?: boolean;
  nestedColumns?: ITableExtColumn[];

  hidden?: any;
  isValueTrunacted?: boolean;
}

interface ITableExtProps {
  useDevExp?: boolean;
  devExpFilters?: boolean;
  devExpNoDataText?: boolean;

  noHeader?: boolean;
  classes?: any;
  dataSource?: any[];
  columns?: ITableExtColumn[];
  calcKey?: string | ((row: any) => string);
  height?: number;
  onChangeSort?: (fieldName: string, isAsc: boolean) => void;
  calcLink?: (row: any, index?: number) => string;
  calcLinkOnClick?: (row: any) => void;
  onClickCell?: (row: any, key: any, e: any) => void;
  disableSort?: boolean;
  notsaveSortState?: string;
  saveSortState?: string;
  defaultSort?: { field: TypeField; isAsc?: boolean };
  style?: any;
  styleHeader?: any;
  styleRow?: any;
  isVirtual?: boolean;
  checkForArrays?: boolean;
  prefixHelpIdForColumnsAuto?: string;
  headerHelpIconId?: (column: ITableExtColumn) => string;
  headerNowrap?: boolean;
  showEmptyIcon?: boolean | string | Element;
  isDetailTheme?: boolean;
  autoInfiniteScroll?: number;
  onNeedMore?: () => void;
  onNeedMoreScrollableAncestor?: any;
  remoteRowCount?: number;
  isChecked?: boolean;
  defaultChecked?: any;
  onChangeChecked?: (keys: any[]) => void;
  rowHeightVirtual?: number;
  headersNatural?: boolean;
  rowAsCheckbox?: boolean;
  whiteText?: boolean;
  forceAutoWidth?: boolean;
  virtualFlexShrink?: any;
  noAutoTooltip?: boolean;
  showNulls?: boolean;
  calcIsSelected?: (index: number) => boolean;
  separator1?: boolean;
  separatorDark?: boolean;
  separatorDark2?: boolean;
  autoFilter?: string[];
  autoHeight?: boolean;
  noHover?: boolean;
  isNullSort?: boolean;
}

interface ITableExtState {
  sortByField?: TypeField;
  sortOrderIsAsc?: boolean;
  isMedium?: boolean;
  isLarge?: boolean;
  checkedKeys?: any;
  filterText?: string;
  autoInfiniteScrollLength?: number;
}

export const stylesTable = (theme) => ({
  flexContainer: {
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
  },
  tableRow: {
    cursor: 'pointer',
    outline: 'none !important',
  },
  separatorBottomDark: {
    borderBottom: '1px solid rgba(0,0,0,0.33)',
  },
  separatorBottomDark2: {
    borderBottom: '2px solid rgba(0,0,0,0.33)',
  },
  separatorBottom: {
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  tableRowHover: {
    '&:hover': {
      backgroundColor: (props) => (props.noHover ? '#1f2c3b' : props.whiteText ? 'rgba(255,255,255,0.2)' : props.isDetailTheme ? '#284192' : theme.palette.grey[200]),
    },
  },
  tableRowSel: {
    backgroundColor: '#346235 !important',
  },
  tableCell: {
    color: (props) => (props.whiteText ? 'white' : null),
    flex: 1,
  },
  noClick: {
    cursor: 'initial',
  },
});

class TableExt extends React.PureComponent<ITableExtProps, ITableExtState> {
  static saveSortForSaveTable: (saveSortState: string, field: TypeField, isAsc?: boolean) => void;
  isM: boolean;
  _cacheAutoHeight: any;
  refDataGrid: any; //DataGrid;
  virtualGridRef: any;

  constructor(props) {
    super(props);

    let checkedKeys = props.defaultChecked || [];

    this.state = {
      checkedKeys,
      autoInfiniteScrollLength: this.calcInfiniteScrollPage(props),
    };
  }

  scrollToPosition = (pos: number = 0) => {
    this.virtualGridRef?.scrollToPosition?.(pos);
  };

  needMoreNow = () => {
    if (this.props.autoInfiniteScroll != null) {
      if (this.props.dataSource?.length > this.state.autoInfiniteScrollLength) {
        this.setState({
          autoInfiniteScrollLength: Math.min(this.props.dataSource?.length, (this.state.autoInfiniteScrollLength ?? 0) + this.calcInfiniteScrollPage()),
        });
      }
    }
  };

  calcInfiniteScrollPage = (props?) => {
    return (props ?? this.props).autoInfiniteScrollLength ?? 50;
  };

  componentDidMount() {
    this.isM = true;

    if (this.props.saveSortState) {
      let sortState = Utils.dataNum('tableExt_sort_' + this.props.saveSortState);
      if (sortState && sortState.sortState) {
        this.setState({
          sortByField: sortState.sortState.sortByField,
          sortOrderIsAsc: sortState.sortState.sortOrderIsAsc,
        });
        return;
      }
    }
    if (this.props.defaultSort && this.props.defaultSort.field) {
      this.setState({
        sortByField: this.props.defaultSort.field,
        sortOrderIsAsc: this.props.defaultSort.isAsc == null ? false : this.props.defaultSort.isAsc,
      });
    }
  }

  setSortField = (field: TypeField, isAsc: boolean = false) => {
    let stateNew = {
      sortByField: field,
      sortOrderIsAsc: isAsc == null ? false : isAsc,
    };
    this.setState(stateNew, () => {
      if (this.props.saveSortState) {
        TableExt.saveSortForSaveTable(this.props.saveSortState, field, isAsc);
      }
      if (this.props.autoHeight) {
        this.refreshHeights();
      }
    });
  };

  componentWillUnmount() {
    this.isM = false;
  }

  calcKeyFromField = (field: TypeField) => {
    if (field == null) {
      return '';
    } else if (_.isString(field)) {
      return field;
    } else if (_.isArray(field)) {
      return _.reduce(
        field,
        (res, value) => {
          if (res !== '') {
            res += '.';
          }
          return res + value;
        },
        '',
      );
    } else {
      return '';
    }
  };

  onSortHeaderClick = (column) => {
    let isAsc = true;
    if (column && (_.isEqual(column.sortField, this.state.sortByField) || _.isEqual(column.field, this.state.sortByField))) {
      isAsc = !this.state.sortOrderIsAsc;
    }

    this.setSortField(column.sortField || column.field, isAsc);
  };

  calcValueField = (value: any, field: TypeField, getIntoArray = true) => {
    if (value == null || field == null) {
      return null;
    } else {
      let res = null;
      if (_.isString(field)) {
        res = value[field as string];
      } else if (_.isArray(field)) {
        res = _.reduce(
          field,
          (res, value) => {
            if (res != null) {
              res = res[value];
            }
            return res;
          },
          value ?? {},
        );
      } else {
        return null;
      }

      if (getIntoArray && res != null && _.isArray(res)) {
        res = res[0];
      }
      return res;
    }
  };

  memSort = memoizeOne((dataSource, sortByField, sortOrderIsAsc, checkForArrays, filterText, isNullSort) => {
    if (dataSource && _.isArray(dataSource) && dataSource.length > 0 && sortByField && sortOrderIsAsc != null) {
      dataSource = dataSource.sort((a, b) => {
        if (a == null || b == null) {
          return 0;
        }
        let va = this.calcValueField(a, sortByField);
        let vb = this.calcValueField(b, sortByField);

        let res = 0;
        if (va == null && vb == null) {
          res = 0;
        } else if (va == null) {
          res = isNullSort ? -1 : 1;
        } else if (vb == null) {
          res = isNullSort ? 1 : -1;
        } else {
          if (_.isNumber(va) && _.isNumber(vb)) {
            res = va - vb;
          } else {
            res = ('' + va).toLowerCase().localeCompare(('' + vb).toLowerCase());
          }
        }

        if (!sortOrderIsAsc) {
          // eslint-disable-next-line operator-assignment
          res = -1 * res;
        }
        return res;
      });
    }

    if (this.props.autoFilter != null && this.props.autoFilter.length > 0 && _.trim(filterText || '') !== '') {
      dataSource = dataSource?.filter((d1) => {
        let pass = false;
        this.props.autoFilter.some((f1, f1ind) => {
          let s1 = d1?.[f1];
          if (s1 == null) {
            //
          } else if (_.isNumber(s1)) {
            s1 = '' + s1;
          } else if (!_.isString(s1)) {
            s1 = null;
          }
          if (s1 != null && Utils.searchIsTextInside(s1?.toLowerCase(), filterText)) {
            pass = true;
            return true;
          }
        });
        return pass;
      });
    }

    return dataSource;
  });

  memColumns: (columns: ITableExtColumn[], isLarge: boolean, isMedium: boolean) => ITableExtColumn[] = memoizeOne((columns: ITableExtColumn[], isLarge, isMedium) => {
    if (columns && columns.length > 0) {
      let anyWithValue = false,
        anyEmpty = false;
      columns.some((c1) => {
        if (Utils.isNullOrEmpty(c1.width)) {
          anyEmpty = true;
        } else {
          anyWithValue = true;
        }
        c1.widthToUse = (isLarge ? c1.widthLessLarge ?? c1.widthLessMedium : isMedium ? c1.widthLessMedium : c1.width) ?? c1.width;
      });

      if (isLarge) {
        columns = columns.filter((c1) => c1.hideLessLarge !== true);
      }
      if (isLarge || isMedium) {
        columns = columns.filter((c1) => c1.hideLessMedium !== true);
      }

      if (!isLarge) {
        columns = columns.filter((c1) => c1.hideMoreLarge !== true);
      }
      if (!isLarge && !isMedium) {
        columns = columns.filter((c1) => c1.hideMoreLarge !== true);
        columns = columns.filter((c1) => c1.hideMoreMedium !== true);
      }

      if (!anyEmpty && anyWithValue) {
        return [...columns, { title: '' }];
      }
    }
    return columns;
  });

  headerRenderer = ({ columnIndex, otherProps, colWidth = null }) => {
    if (this.props.noHeader) {
      return null;
    }

    let { headerHelpIconId, dataSource, columns, calcKey, height, calcLink, disableSort, isVirtual } = this.props;
    let { sortByField, sortOrderIsAsc } = this.state;
    const { classes } = this.props;

    columns = this.memColumns(columns, this.state.isLarge, this.state.isMedium);

    let col1 = columns?.[columnIndex];
    let helpId = col1?.helpId ?? null;
    let helpIcon = null;
    if (headerHelpIconId) {
      let helpId2 = headerHelpIconId(col1);
      if (helpId2 != null) {
        helpId = helpId2;
      }
    }
    if (Utils.isNullOrEmpty(helpId) && !Utils.isNullOrEmpty(this.props.prefixHelpIdForColumnsAuto)) {
      helpId = this.props.prefixHelpIdForColumnsAuto + '_' + col1?.title?.toLowerCase();
    }
    if (helpId != null && helpId !== '') {
      helpIcon = (
        <span style={{ marginLeft: '4px' }}>
          <HelpIcon id={helpId} />
        </span>
      );
    } else if (!Utils.isNullOrEmpty(col1?.helpTooltip)) {
      helpIcon = (
        <span style={{ marginLeft: '4px' }}>
          <HelpIcon tooltipText={col1?.helpTooltip} />
        </span>
      );
    }

    let c1 = otherProps;
    let styleCell1: CSSProperties = { whiteSpace: this.props.headerNowrap ? 'nowrap' : 'normal', wordBreak: 'normal' };
    if (c1.title != null && _.isString(c1.title) && c1.title.length < 18 && !this.props.headerNowrap) {
      if (c1.forceNoWrap == null || c1.forceNoWrap === true) {
        styleCell1.whiteSpace = 'nowrap';
      }
    }
    if (this.props.headersNatural) {
      styleCell1.textTransform = 'none';
    }
    if (this.props.whiteText) {
      styleCell1.color = 'white';
    }
    let cell1 = (
      <span style={styleCell1} className={s.header}>
        {c1.title}
        {helpIcon}
      </span>
    );

    let styleCellParent1 = {} as CSSProperties;
    if (isVirtual) {
      styleCellParent1.overflow = 'hidden';
    }
    if (this.props.whiteText) {
      styleCellParent1.color = 'white';
    }

    if (disableSort !== true && c1.disableSort !== true) {
      cell1 = (
        <TableSortLabel
          style={styleCellParent1}
          active={!Utils.isNullOrEmpty(sortByField) && (_.isEqual(sortByField, c1.field) || _.isEqual(sortByField, c1.sortField))}
          direction={sortOrderIsAsc ? 'asc' : 'desc'}
          onClick={this.onSortHeaderClick.bind(this, c1)}
        >
          {cell1}
        </TableSortLabel>
      );
    }

    let styleCol: CSSProperties = _.assign({}, this.props.styleHeader || {});

    if (isVirtual) {
      styleCol.height = this.calcRowHeightVirtual() + 'px';
    } else {
      if (c1.widthToUse != null) {
        styleCol.width = c1.widthToUse;
      }
      if (c1.forceNoWrap != null) {
        styleCol.whiteSpace = c1.forceNoWrap ? 'nowrap' : 'normal';
        if (!c1.forceNoWrap) {
          styleCol.wordWrap = 'normal';
        }
      }
    }

    let ppVirtual = this.props.isVirtual ? { component: 'div', variant: 'head' } : {};
    if (this.props.headersNatural) {
      styleCol.textTransform = 'none';
    }

    let cc = isVirtual ? classNames(classes.tableCell, classes.flexContainer, classes.noClick, s.header) : classNames(s.header);

    return (
      /* @ts-ignore */
      <TableCell className={cc} {...ppVirtual} style={styleCol} key={'head_' + this.calcKeyFromField(c1.field) + '_' + columnIndex} align={c1.align || 'left'}>
        {cell1}
      </TableCell>
    );
  };

  calcRowHeightVirtual = () => {
    return this.props.rowHeightVirtual || 56;
  };

  getRowClassName = ({ index }) => {
    const {
      classes: { tableRow, tableRowHover, flexContainer, tableRowSel, separatorBottom, separatorBottomDark, separatorBottomDark2 },
      // rowClassName,
      // onRowClick
    } = this.props;
    return classNames({
      [s.backCell]: true,
      [tableRow]: true,
      [flexContainer]: true,
      [separatorBottom]: this.props.separator1 === true,
      [separatorBottomDark]: this.props.separatorDark === true,
      [separatorBottomDark2]: this.props.separatorDark2 === true,
      // [s.rowOdd]: index % 2 === 0,
      // [s.rowEven]: index % 2 === 1,
      // [rowClassName]: true,
      [tableRowHover]: index !== -1,
      [tableRowSel]: this.props.calcIsSelected?.(index) ?? false,
    });
  };

  onClickCell = (link1, key1, row, e) => {
    if (!Utils.isNullOrEmpty(link1)) {
      Link.doGotoLink(link1, e);
    } else if (this.props.rowAsCheckbox) {
      this.onChangeCheckedRow(key1, e);
    }

    this.props.onClickCell?.(row, key1, e);
  };

  cellRenderer = ({ cellData, key = null, parent = null, columnIndex = null, rowIndex, rowSpan, colSpan = null, subItemIndex, isSecond = null, showSep = false }) => {
    let { columns, classes, calcKey, calcLink } = this.props;
    columns = this.memColumns(columns, this.state.isLarge, this.state.isMedium);

    let c1 = (columns ? columns[columnIndex] : null) ?? {};
    let row = this.rowGetter({ index: rowIndex });
    let rowInd = rowIndex;

    //
    let key1 = 'row_' + rowInd;
    if (calcKey) {
      if (_.isString(calcKey)) {
        key1 = row[calcKey as string] || key1;
      } else {
        // @ts-ignore
        key1 = calcKey(row) || key1;
      }
    }

    //
    let value = this.calcValueField(row, c1.field, subItemIndex == null);

    if (subItemIndex != null && _.isArray(value)) {
      value = value[subItemIndex];
    }

    if (isSecond) {
      if (c1.renderSecondRow) {
        value = c1.renderSecondRow(value, row, rowInd);
        if (value == null) {
          return null;
        }

        if (c1.useSecondRowArrow) {
          value = (
            <div
              css={`
                margin: 10px 30px;
                display: flex;
                align-items: center;
              `}
            >
              <div
                css={`
                  color: white;
                  margin-right: 15px;
                `}
              >
                <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faArrowAltFromLeft').faArrowAltFromLeft} transform={{ size: 19, x: 0, y: 0 }} />
              </div>
              <div
                css={`
                  flex: 1;
                `}
              >
                {value}
              </div>
            </div>
          );
        }
      }
    } else {
      if (this.props.showNulls) {
        if (value === null) {
          value = <NullShow value={value} />;
        }
      }

      if (c1.render) {
        value = c1.render(value, row, rowInd, this.state.isLarge);
      }
    }

    let link1 = '';
    if (calcLink && !isSecond) {
      link1 = calcLink(row, rowIndex) || '';
    }

    let styleCol: CSSProperties = _.assign({ padding: 0 }, this.props.styleRow || {});
    if (c1.widthToUse != null && !isSecond) {
      styleCol.width = c1.widthToUse;
    }
    if (c1.forceNoWrap != null && !isSecond) {
      styleCol.whiteSpace = c1.forceNoWrap ? 'nowrap' : 'normal';
      if (!c1.forceNoWrap) {
        styleCol.wordWrap = 'normal';
      }
    }
    if (this.props.whiteText) {
      styleCol.color = 'white';
    }

    if (!isSecond) {
      let isLi = false;
      if (c1.isLinked != null && _.isFunction(c1.isLinked)) {
        isLi = c1.isLinked(row);
      } else {
        isLi = c1.isLinked as boolean;
      }

      let isBlLi = false;
      if (c1.isBlueLight != null && _.isFunction(c1.isBlueLight)) {
        isBlLi = c1.isBlueLight(row);
      } else {
        isBlLi = c1.isBlueLight as boolean;
      }

      value = (
        <div style={this.props.autoHeight ? { padding: '15px' } : { padding: '15px', width: '100%' }} className={isLi ? sd.linkBlue : isBlLi ? sd.linkBlueLight : ''}>
          {value}
        </div>
      );
    }

    if (link1 != null && link1 !== '' && !isSecond && !c1.noLink) {
      let onClick1: any = null;
      if (this.props.calcLinkOnClick != null) {
        onClick1 = (e) => {
          this.props.calcLinkOnClick?.(row);
        };
      }
      value = (
        <Link style={this.props.autoHeight ? {} : { width: '100%' }} to={link1} onClick={onClick1}>
          {value}
        </Link>
      );
    } else if (c1.noLink) {
      value = (
        <div
          style={this.props.autoHeight ? {} : { width: '100%' }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {value}
        </div>
      );
    }

    let ppVirtual = this.props.isVirtual ? { component: 'div', variant: 'body' } : {};

    let cc = this.props.isVirtual
      ? classNames(classes.tableCell, s.cell, s.root, s.rela, {
          [classes.flexContainer]: true,
          // [classes.noClick]: onRowClick == null,
        })
      : classNames(s.cell, s.root, s.rela);

    if (this.props.rowAsCheckbox) {
      styleCol.cursor = 'pointer';
    }

    if (this.props.isVirtual && !c1.noAutoTooltip && !this.props.noAutoTooltip) {
      styleCol.overflowX = 'hidden';
      value = <TooltipExtOver isValueTrunacted={c1.isValueTrunacted}>{value}</TooltipExtOver>;
    }

    let res = (
      /* @ts-ignore */
      <TableCell
        onClick={this.onClickCell.bind(this, link1, key1, row)}
        rowSpan={rowSpan}
        colSpan={colSpan}
        className={cc + ' ' + (showSep ? (this.props.separator1 ? s.separator1 : '') + ' ' + (this.props.separatorDark ? s.separatorDark : '') + ' ' + (this.props.separatorDark2 ? s.separatorDark2 : '') : '')}
        {...ppVirtual}
        key={'cell_' + key1 + '_' + this.calcKeyFromField(c1.field) + '_' + columnIndex + '_' + (isSecond ? 'two' : '')}
        align={c1.align || 'left'}
        style={styleCol}
      >
        {value}
      </TableCell>
    );

    if (this.props.autoHeight) {
      res = (
        <CellMeasurer cache={this._cacheAutoHeight} columnIndex={columnIndex} key={key} parent={parent} rowIndex={rowIndex}>
          {res}
        </CellMeasurer>
      );
    }

    return res;
  };

  refreshHeights = () => {
    this._cacheAutoHeight?.clearAll();
    this.forceUpdate();
  };

  onRowClick = ({ event, index, rowData }) => {
    event && event.stopPropagation();

    const { calcLink } = this.props;
    let row = this.rowGetter({ index: index });

    let link1 = '';
    if (calcLink) {
      link1 = calcLink(row, index) || '';
    }

    if (link1 != null && link1 !== '') {
      Link.doGotoLink(link1, event);
    }
  };

  rowGetter = ({ index }) => {
    let { dataSource, checkForArrays, isNullSort } = this.props;
    let { sortByField, sortOrderIsAsc } = this.state;

    dataSource = this.memSort(dataSource, sortByField, sortOrderIsAsc, checkForArrays, this.state.filterText, isNullSort);

    return (dataSource || [])[index];
  };

  onChangeWinSize = (isMedium, isSmall, isLarge) => {
    if (this.state.isMedium !== isMedium || this.state.isLarge !== isLarge) {
      setTimeout(() => {
        if (!this.isM) {
          return;
        }

        this.setState({
          isMedium,
          isLarge,
        });
      }, 0);
    }
  };

  onChangeCheckedRow = (key1, e) => {
    let checkedKeys = this.state.checkedKeys;
    checkedKeys = [...(checkedKeys ?? [])];
    if (checkedKeys.indexOf(key1) > -1) {
      checkedKeys = checkedKeys.filter((v1) => v1 !== key1);
    } else {
      checkedKeys.push(key1);
    }
    this.setState({
      checkedKeys,
    });
    this.props.onChangeChecked?.(checkedKeys);
  };

  calcDataSource = () => {
    let list = this.props.dataSource;
    let autoInfiniteScroll = this.props.autoInfiniteScroll;
    if (autoInfiniteScroll == null) {
      return list;
    } else {
      return list?.slice(0, this.state.autoInfiniteScrollLength);
    }
  };

  onCheckedSelectAll = (e) => {
    if (!e.target.checked) {
      this.setState({
        checkedKeys: [],
      });
      this.props.onChangeChecked?.([]);
      return;
    }

    let dataSource = this.calcDataSource();
    let calcKey = this.props.calcKey;

    let allKeys = [];
    dataSource?.some((row, rowInd) => {
      let key1 = 'row_' + rowInd;
      if (calcKey) {
        if (_.isString(calcKey)) {
          key1 = row[calcKey as string] || key1;
        } else {
          // @ts-ignore
          key1 = calcKey(row) || key1;
        }
      }

      allKeys.push(key1);
    });

    this.setState({
      checkedKeys: allKeys,
    });
    this.props.onChangeChecked?.(allKeys);
  };

  memAutoHeightForWidth = memoizeOne((width) => {
    if (!this.props.autoHeight) {
      return;
    }

    this._cacheAutoHeight = new CellMeasurerCache({
      defaultWidth: width,
      fixedWidth: true,
    });
  });

  memColumnsNested = memoizeOne((columns: ITableExtColumn[]) => {
    let res: any = {},
      listNames = [];
    columns?.some((c1) => {
      if (c1.isNested) {
        res[c1.field as string] = c1.nestedColumns;
        listNames.push(c1.field);
      }
    });

    if (res.length === 0) {
      res = null;
    }

    return { columnsNested: res, listNames };
  });

  memColumnsDevExp = memoizeOne((columns: ITableExtColumn[]) => {
    let cols = columns;
    if (cols) {
      let res = [];
      cols?.some((c1) => {
        if (c1.isNested) {
          return;
        }

        const name1 = c1.title;
        res.push({ key: 'col' + name1 + ' ' + c1.field, caption: name1, dataField: c1.field, dataType: c1.dataType, alignment: c1.align });
      });
      return res;
    }
  });

  onRowDblClickDevExp = (e: any /*RowDblClickEvent*/) => {
    if (this.refDataGrid?.instance?.isRowExpanded(e.key)) {
      this.refDataGrid?.instance?.collapseRow(e.key);
    } else {
      this.refDataGrid?.instance?.expandRow(e.key);
    }
  };

  onEditorPreparedDevExp = (e: any /*EditorPreparedEvent*/) => {};

  onRowPreparedDevExp = (e: any /*RowPreparedEvent*/) => {
    e.rowElement.style.height = '50px';
  };

  onSelectionChangesDevExp = (rows: any[]) => {
    this.props.onClickCell?.(rows?.[0], null, null);
  };

  onCellPreparedDevExp = (e: any /*CellPreparedEvent*/) => {
    e.cellElement.style.verticalAlign = 'middle';
  };

  render() {
    let { columns, calcKey, height, calcLink, disableSort, isVirtual, checkForArrays, isNullSort } = this.props;
    let { sortByField, sortOrderIsAsc } = this.state;

    let dataSource = this.calcDataSource();
    dataSource = this.memSort(dataSource, sortByField, sortOrderIsAsc, checkForArrays, this.state.filterText, isNullSort);
    columns = this.memColumns(columns, this.state.isLarge, this.state.isMedium);

    let styleTable: CSSProperties = _.assign({ width: '100%' }, this.props.style || {});

    let res = null;

    let isEmpty = dataSource == null || dataSource.length === 0;
    let { showEmptyIcon }: { showEmptyIcon?: any } = this.props;
    if (showEmptyIcon == null) {
      isEmpty = false;
    }

    let filterElem = null,
      topFilterHH = 0;
    if (this.props.autoFilter != null && this.props.autoFilter.length > 0) {
      filterElem = (
        <div
          css={`
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 4px;
          `}
        >
          <span
            css={`
              margin-right: 5px;
            `}
          >
            Filter:
          </span>
          <span
            css={`
              width: 240px;
            `}
          >
            <Input
              value={this.state.filterText}
              onChange={(e) => {
                this.setState({ filterText: e.target.value });
              }}
            />
          </span>
        </div>
      );
      topFilterHH = 46;
    }

    if (this.props.useDevExp) {
      let columnsList = this.memColumnsDevExp(this.props.columns);
      let { columnsNested, listNames } = this.memColumnsNested(this.props.columns) ?? {};

      let showFilters = !!this.props.devExpFilters;

      res = (
        <AutoSizer>
          {({ width, height }) => {
            return (
              <React.Suspense fallback={<div></div>}>
                <DevDataGrid
                  refInt={(r1) => {
                    this.refDataGrid = r1;
                  }}
                  onRowDblClick={this.onRowDblClickDevExp}
                  hoverStateEnabled={true}
                  dataSource={dataSource}
                  noDataText={this.props.devExpNoDataText ? '' : 'No Data'}
                  allowColumnReordering={true}
                  showBorders={true}
                  height={height}
                  width={width}
                  allowColumnResizing={true}
                  columnWidth={columnsList?.length > 10 ? 160 : undefined}
                  columnResizingMode={'widget'}
                  selection={{ mode: 'single' }}
                  onEditorPrepared={this.onEditorPreparedDevExp}
                  onRowPrepared={this.onRowPreparedDevExp}
                  onCellPrepared={this.onCellPreparedDevExp}
                  onSelectionChanges={this.onSelectionChangesDevExp}
                  showFilters={showFilters}
                  columnsNested={columnsNested}
                  listNames={listNames}
                  columnsList={columnsList}
                />
              </React.Suspense>
            );
          }}
        </AutoSizer>
      );
    } else if (isVirtual) {
      let { classes } = this.props;
      let isElem = Utils.isElement(showEmptyIcon);
      let noContentRenderer = isEmpty
        ? () => (
            /* @ts-ignore */
            <div
              className={s.rowOdd}
              style={{ padding: '8px 0', background: '#19232f' }}
              css={`
                border-bottom-left-radius: 8px;
                border-bottom-right-radius: 8px;
              `}
            >
              {isElem && showEmptyIcon}
              {!isElem && (
                <div style={{ textAlign: 'center', marginTop: '2px' }}>
                  <FontAwesomeIcon icon={['fad', 'box-open']} transform={{ size: 24, x: 0, y: 0 }} style={{ opacity: 0.8 }} />
                </div>
              )}
              {!isElem && (
                <div style={{ marginTop: '4px', fontWeight: 300, fontSize: '13px', textAlign: 'center', opacity: 0.5, cursor: 'default' }}>
                  {_.isString(showEmptyIcon) && showEmptyIcon}
                  {!_.isString(showEmptyIcon) && 'Empty'}
                </div>
              )}
            </div>
          )
        : undefined;

      res = (
        <AutoSizer disableHeight>
          {({ width }) => {
            this.memAutoHeightForWidth(width);

            let allWidthNull: any = columns && columns.filter((c1) => c1.widthToUse == null).length === columns.length;
            if (allWidthNull && columns) {
              allWidthNull = Math.floor(width / columns.length);
            } else {
              allWidthNull = null;
            }

            let calcColWidth = (colWidth) => {
              if (_.isString(colWidth)) {
                if (_.endsWith(colWidth, '%')) {
                  colWidth = Utils.tryParseFloat(colWidth.replace('%', ''));
                  if (colWidth != null) {
                    colWidth = Math.ceil((width * colWidth) / 100);
                  }
                } else {
                  colWidth = Utils.tryParseFloat(colWidth);
                }
              }
              if (colWidth == null) {
                colWidth = 120;
              }
              return colWidth;
            };
            let columnsWidth =
              columns == null
                ? []
                : columns.map((c1, columnIndex) => {
                    let colWidth = c1.widthToUse;

                    if (allWidthNull != null) {
                      colWidth = allWidthNull;
                    } else if (colWidth == null || colWidth === '') {
                      let total = 0,
                        numNull = 1;
                      columns.some((c2, c2ind) => {
                        if (c2ind !== columnIndex) {
                          if (c2.widthToUse == null) {
                            numNull++;
                          } else {
                            let ww1 = calcColWidth(c2.widthToUse);
                            total += ww1;
                          }
                        }
                      });
                      colWidth = Math.floor((width - total) / numNull);
                    } else {
                      colWidth = calcColWidth(colWidth);
                    }

                    return colWidth;
                  });

            const doTable = (onRowsRendered = undefined, registerChild = undefined) => (
              <TableVirtual
                height={height == null ? height : height - topFilterHH}
                width={width}
                disableHeader={this.props.noHeader}
                rowClassName={this.getRowClassName}
                rowGetter={this.rowGetter}
                rowHeight={this.props.autoHeight ? this._cacheAutoHeight?.rowHeight : this.calcRowHeightVirtual()}
                headerHeight={this.calcRowHeightVirtual()}
                rowCount={(dataSource || []).length}
                onRowClick={this.onRowClick}
                noRowsRenderer={noContentRenderer}
                className={(this.props.isDetailTheme !== false ? s.isDetail : '') + ' ' + sd.noOutline + ' ' + (this.props.whiteText ? sd.virtualTableWhite : '') + ' ' + (this.props.noHover ? s.noHover : '')}
                onRowsRendered={onRowsRendered}
                ref={registerChild}
              >
                {columns &&
                  columns.map((c1, columnIndex) => {
                    let calcKeyFromField1 = this.calcKeyFromField(c1.field);
                    let colWidth = columnsWidth[columnIndex];

                    let flexW = this.props.virtualFlexShrink;
                    if (flexW != null && _.isArray(flexW)) {
                      flexW = flexW[columnIndex];
                    }

                    return (
                      <ColumnVirtual
                        width={colWidth}
                        flexShrink={flexW}
                        dataKey={calcKeyFromField1}
                        key={'col_head_' + calcKeyFromField1 + '_' + columnIndex}
                        headerRenderer={(headerProps) =>
                          this.headerRenderer({
                            ...headerProps,
                            columnIndex: columnIndex,
                            otherProps: c1,
                            colWidth,
                          })
                        }
                        className={classNames(classes.flexContainer)}
                        cellRenderer={this.cellRenderer}
                      />
                    );
                  })}
              </TableVirtual>
            );

            if (this.props.onNeedMore != null) {
              const isRowLoaded = ({ index }) => {
                return !!dataSource?.[index];
              };
              const loadMoreRows = ({ startIndex, stopIndex }) => {
                this.props.onNeedMore?.();
              };
              let remoteRowCount = this.props.remoteRowCount ?? 0;

              return (
                <InfiniteLoader isRowLoaded={isRowLoaded} loadMoreRows={loadMoreRows} rowCount={remoteRowCount}>
                  {({ onRowsRendered, registerChild }) => {
                    let reg1 = (r1) => {
                      this.virtualGridRef = r1;
                      registerChild?.(r1);
                    };
                    return doTable(onRowsRendered, reg1);
                  }}
                </InfiniteLoader>
              );
            } else {
              return doTable(undefined, (r1) => {
                this.virtualGridRef = r1;
              });
            }
          }}
        </AutoSizer>
      );
    } else {
      let rowEvenGlobal = true,
        rowEvenInside = true;

      let rowCount = dataSource?.length ?? 0;
      let numSelected = this.state.checkedKeys?.length ?? 0;
      let isElem = Utils.isElement(showEmptyIcon);

      res = (
        <Table
          style={styleTable}
          className={(this.props.isDetailTheme !== false ? s.isDetail : '') + ' ' + s.root + ' ' + sd.noOutline + ' ' + (this.props.whiteText ? sd.virtualTableWhite : '') + ' ' + (this.props.noHover ? s.noHover : '')}
          stickyHeader
        >
          {this.props.noHeader !== true && (
            <TableHead>
              <TableRow>
                {this.props.isChecked && (
                  <TableCell padding="checkbox">
                    <Checkbox indeterminate={numSelected > 0 && numSelected < rowCount} checked={rowCount > 0 && numSelected === rowCount} onChange={this.onCheckedSelectAll} />
                  </TableCell>
                )}
                {columns &&
                  columns.map((c1, c1Ind) => {
                    return this.headerRenderer({
                      columnIndex: c1Ind,
                      otherProps: c1,
                    });
                  })}
              </TableRow>
            </TableHead>
          )}
          <TableBody>
            {isEmpty && (
              <TableRow key={'empty_row'} className={s.rowOdd}>
                {/*// @ts-ignore*/}
                <TableCell colSpan={columns?.length ?? 1} className={s.cell + ' ' + s.root} style={{ paddingBottom: '7px', paddingTop: '12px' }}>
                  {isElem && showEmptyIcon}
                  {!isElem && (
                    <div style={{ textAlign: 'center' }}>
                      <FontAwesomeIcon icon={['fad', 'box-open']} transform={{ size: 24, x: 0, y: 0 }} style={{ opacity: 0.8 }} />
                    </div>
                  )}
                  {!isElem && (
                    <div style={{ marginTop: '4px', fontWeight: 300, fontSize: '13px', textAlign: 'center', opacity: 0.5, cursor: 'default' }}>
                      {_.isString(showEmptyIcon) && showEmptyIcon}
                      {!_.isString(showEmptyIcon) && 'Empty'}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
            {dataSource &&
              _.flattenDepth(
                dataSource?.map?.((row, rowInd) => {
                  let key1 = 'row_' + rowInd;
                  if (calcKey) {
                    if (_.isString(calcKey)) {
                      key1 = row[calcKey as string] || key1;
                    } else {
                      // @ts-ignore
                      key1 = calcKey(row) || key1;
                    }
                  }

                  let rowSpans = null;
                  let maxRowSpans = null;
                  if (checkForArrays && columns) {
                    rowSpans = [];
                    columns.some((c1, c1ind) => {
                      let row = this.rowGetter({ index: rowInd });
                      let value = this.calcValueField(row, c1.field, false);

                      if (value == null) {
                        rowSpans.push(null);
                      } else if (_.isArray(value)) {
                        rowSpans.push(2);
                        maxRowSpans = maxRowSpans == null ? value.length : Math.max(maxRowSpans, value.length);
                      } else {
                        rowSpans.push(null);
                      }
                    });
                    rowSpans = rowSpans.map((s1) => (s1 == null ? maxRowSpans : null));
                  }

                  let renderRow = (subItemIndex = null) => {
                    let filter1: any = (c1) => true;
                    if (subItemIndex != null) {
                      filter1 = (c1: ITableExtColumn, c1ind) => subItemIndex === 0 || rowSpans[c1ind] == null;
                    }
                    if (subItemIndex === 0 || subItemIndex == null) {
                      rowEvenGlobal = !rowEvenGlobal;
                      rowEvenInside = rowEvenGlobal;
                    } else {
                      rowEvenInside = !rowEvenInside;
                    }
                    let rowE = subItemIndex == null ? rowEvenGlobal : rowEvenInside;

                    let anySecondRowUsed = columns?.find((c1) => c1?.renderSecondRow != null) != null;
                    let secondRow = null;
                    let cellsRender = columns
                      ?.map((c1, c1ind) => {
                        if (filter1(c1, c1ind)) {
                          if (secondRow == null && c1.renderSecondRow != null) {
                            secondRow = this.cellRenderer({ cellData: row, columnIndex: c1ind, rowIndex: rowInd, rowSpan: null, colSpan: columns?.length ?? 1, subItemIndex, isSecond: true, showSep: !isVirtual });
                          }

                          return this.cellRenderer({ cellData: row, columnIndex: c1ind, rowIndex: rowInd, rowSpan: rowSpans ? rowSpans[c1ind] : null, colSpan: null, subItemIndex, isSecond: false, showSep: !anySecondRowUsed && !isVirtual });
                        } else {
                          return null;
                        }
                      })
                      ?.filter((r1) => r1 != null);

                    let row0 = (
                      <TableRow key={key1 + '_' + (subItemIndex ?? '-')} className={this.props.isDetailTheme ? (rowE ? s.rowEven : s.rowOdd) : null}>
                        {this.props.isChecked && (
                          <TableCell padding="checkbox">
                            <Checkbox checked={this.state.checkedKeys?.indexOf(key1) > -1} onChange={this.onChangeCheckedRow.bind(this, key1)} />
                          </TableCell>
                        )}
                        {cellsRender}
                      </TableRow>
                    );

                    let row1 = null;
                    if (secondRow != null) {
                      row1 = (
                        <TableRow key={key1 + '_' + (subItemIndex ?? '-') + 'second'} className={this.props.isDetailTheme ? (rowE ? s.rowEven : s.rowOdd) : null}>
                          {secondRow}
                        </TableRow>
                      );
                      return [row0, row1];
                    } else {
                      return [row0];
                    }
                  };

                  if (maxRowSpans == null) {
                    return renderRow(null);
                  } else {
                    let resRR = [];
                    for (let k = 0; k < maxRowSpans; k++) {
                      resRR.push(renderRow(k));
                    }
                    return resRR;
                  }
                }),
                2,
              )}
          </TableBody>
        </Table>
      );
    }

    if (!isVirtual && height != null) {
      let styleTable: CSSProperties = { position: 'relative' };
      styleTable.height = height - topFilterHH + 'px';
      styleTable.overflow = 'auto';

      return (
        <div className={'dxAbacus'} style={styleTable}>
          <WindowSizeSmart onChange={this.onChangeWinSize} />
          <NanoScroller>
            {filterElem}
            {res}
          </NanoScroller>
        </div>
      );
    } else if (isVirtual) {
      if (filterElem == null) {
        return (
          <div className={'dxAbacus'}>
            <WindowSizeSmart onChange={this.onChangeWinSize} />
            {res}
          </div>
        );
      } else {
        return (
          <div
            className={'dxAbacus'}
            css={`
              ${height == null ? '' : 'height: ' + height + 'px;'} display: block;
              position: relative;
            `}
          >
            <WindowSizeSmart onChange={this.onChangeWinSize} />
            <div
              css={`
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: ${topFilterHH}px;
              `}
            >
              {filterElem}
            </div>
            <div
              css={`
                position: absolute;
                top: ${topFilterHH}px;
                left: 0;
                right: 0;
                bottom: 0;
              `}
            >
              {res}
            </div>
          </div>
        );
      }
    } else if (this.props.forceAutoWidth) {
      return (
        <div className={'dxAbacus'}>
          <WindowSizeSmart onChange={this.onChangeWinSize} />
          <AutoSizer disableHeight>
            {({ width }) => {
              return (
                <div style={{ width: width + 'px' }}>
                  <Paper className={s.tableHorizontal}>
                    {filterElem}
                    {res}
                  </Paper>
                </div>
              );
            }}
          </AutoSizer>
        </div>
      );
    } else {
      let onNeedMore = this.props.onNeedMore;
      if (this.props.autoInfiniteScroll != null) {
        if (onNeedMore == null) {
          if (this.props.dataSource?.length > this.state.autoInfiniteScrollLength) {
            onNeedMore = () => {
              this.setState({
                autoInfiniteScrollLength: Math.min(this.props.dataSource?.length, (this.state.autoInfiniteScrollLength ?? 0) + this.calcInfiniteScrollPage()),
              });
            };
          }
        }
      }

      return (
        <div className={'dxAbacus'}>
          <WindowSizeSmart onChange={this.onChangeWinSize} />
          <Paper className={s.tableHorizontal}>
            {filterElem}
            {res}
          </Paper>
          {onNeedMore != null && <Waypoint onEnter={onNeedMore} scrollableAncestor={this.props.onNeedMoreScrollableAncestor} />}
          {onNeedMore != null && (
            <div
              css={`
                height: 20px;
              `}
            >
              &nbsp;
            </div>
          )}
        </div>
      );
    }
  }
}

// @ts-ignore
TableExt.defaultProps = {
  isDetailTheme: true,
};

TableExt.saveSortForSaveTable = (saveSortState: string, field: TypeField, isAsc: boolean = false) => {
  let stateNew = {
    sortByField: field,
    sortOrderIsAsc: isAsc == null ? false : isAsc,
  };
  if (saveSortState) {
    Utils.dataNum('tableExt_sort_' + saveSortState, undefined, { sortState: stateNew });
  }
};

// @ts-ignore
export default withStyles(stylesTable)(TableExt);
