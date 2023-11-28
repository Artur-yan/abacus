import Radio from 'antd/lib/radio';
import * as _ from 'lodash';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import MultiGrid from 'react-virtualized/dist/commonjs/MultiGrid';
import styled from 'styled-components';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import Constants from '../../constants/Constants';
import eda from '../../stores/reducers/eda';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./EDADataConsistencyAnalysis.module.css');
const sd = require('../antdUseDark.module.css');

interface IEDADataConsistencyAnalysisProps {}

const cellHH = 54;

const StyleLabel = styled.div`
  font-family: Matter;
  font-size: 15px;
  font-weight: 600;
  color: #f1f1f1;
`;

const borderAAA = Constants.lineColor(); //Utils.colorA(0.3);
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

enum TableType {
  Duplicates = 'Duplicate Primary Keys',
  Deletions = 'Deletions',
  DataVariations = 'Data Variation',
}

const EDADataConsistencyAnalysis = React.memo((props: PropsWithChildren<IEDADataConsistencyAnalysisProps>) => {
  const { paramsProp, edaParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    edaParam: state.eda,
  }));

  const [showType, setShowType] = useState('');
  const [featureName, setFeatureName] = useState(null);
  const [version, setVersion] = useState(null);
  const [edaId, setEdaId] = useState(null);
  const [tableType, setTableType] = useState(TableType.Duplicates);

  const projectId = paramsProp?.get('projectId');
  const edaIdUsed = paramsProp?.get('edaId');
  const featureNameUsed = paramsProp?.get('featureName');
  const tableTypeUsed = paramsProp?.get('tableType');

  useEffect(() => {
    setVersion(null);
  }, [edaId]);

  useEffect(() => {
    if (tableTypeUsed === '1') {
      setTableType(TableType.Duplicates);
    } else if (tableTypeUsed === '2') {
      setTableType(TableType.Deletions);
    } else if (tableTypeUsed === '3') {
      setTableType(TableType.DataVariations);
    }
  }, [tableTypeUsed]);

  useEffect(() => {
    setFeatureName(featureNameUsed);
  }, [featureNameUsed]);

  useEffect(() => {
    setEdaId(edaIdUsed);
  }, [edaIdUsed]);

  useEffect(() => {
    eda.memEdaById(true, edaId);
  }, [edaId, edaParam]);

  const edaOne = useMemo(() => {
    return eda.memEdaById(false, edaId);
  }, [edaId, edaParam]);

  useEffect(() => {
    setVersion((v1) => {
      if (v1 == null) {
        v1 = edaOne?.latestEdaVersion?.edaVersion;
      }
      return v1;
    });
  }, [edaOne]);

  useEffect(() => {
    eda.memEdaDataConsistencyByEdaVersion(true, version);
  }, [version, edaParam]);

  const edaDataConsistency = useMemo(() => {
    return eda.memEdaDataConsistencyByEdaVersion(false, version);
  }, [version, edaParam]);

  useEffect(() => {
    eda.memEdasByProjectId(true, projectId);
  }, [projectId, edaParam]);

  const edaList = useMemo(() => {
    return eda.memEdasByProjectId(false, projectId);
  }, [projectId, edaParam]);

  useEffect(() => {
    eda.memEdaVersionsById(true, edaId);
  }, [edaId, edaParam]);

  const edaVersionList = useMemo(() => {
    return eda.memEdaVersionsById(false, edaId);
  }, [edaId, edaParam]);

  useEffect(() => {
    if (tableType === TableType.Duplicates) {
      setShowType('');
      return;
    }

    setShowType('B');
  }, [tableType]);

  const sortedColumnNames = useMemo(() => {
    const columnNames = [...(edaDataConsistency?.columnNames ?? [])];
    const primaryKeys = edaDataConsistency?.primaryKeys ?? [];
    columnNames.sort((x, y) => (primaryKeys.includes(x) && primaryKeys.includes(y) ? 0 : primaryKeys.includes(x) ? -1 : primaryKeys.includes(y) ? 1 : 0));

    return columnNames;
  }, [edaDataConsistency]);

  const columns = useMemo(() => {
    if (tableType === TableType.DataVariations) {
      return (edaDataConsistency?.transformations?.[featureName]?.column_names ?? []).map((k1) => ({ width: 100, noAutoTooltip: true, title: k1, field: k1 })) as ITableExtColumn[];
    }

    const primaryKeys = edaDataConsistency?.primaryKeys ?? [];

    return sortedColumnNames.map((k1) => ({ width: 100, noAutoTooltip: true, title: primaryKeys.includes(k1) ? `${k1} **` : k1, field: k1 })) as ITableExtColumn[];
  }, [edaDataConsistency, featureName, tableType, sortedColumnNames]);

  const [rowSelectBelow, setRowSelectBelow] = useState(null);
  const [rowHoverBelow, setRowHoverBelow] = useState(null);
  const [rowSelectAbove, setRowSelectAbove] = useState(null);
  const [rowHoverAbove, setRowHoverAbove] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const refGridB = useRef(null);
  const refGridA = useRef(null);
  const refDetailScroll = useRef(null);

  const onClickRow = useCallback((isBelow, rowIndex, e) => {
    if (rowIndex < 1) {
      return;
    }

    setShowType(isBelow ? 'B' : 'A');
    setShowDetail(true);

    setRowSelectBelow((s1) => {
      let v1 = isBelow ? rowIndex : null;
      if (v1 === s1) {
        v1 = null;
        if (isBelow) {
          setShowDetail(false);
        }
      }
      return v1;
    });
    setRowSelectAbove((s1) => {
      let v1 = isBelow ? null : rowIndex;
      if (v1 === s1) {
        v1 = null;
        if (!isBelow) {
          setShowDetail(false);
        }
      }
      return v1;
    });

    refGridB?.current?.forceUpdateGrids();
    refGridA?.current?.forceUpdateGrids();
  }, []);

  const onRowMouseChangeIndex = useCallback((isBelow, rowIndex) => {
    if (isBelow) {
      setRowHoverBelow(rowIndex);
      refGridB?.current?.forceUpdateGrids();
    } else {
      setRowHoverAbove(rowIndex);
      refGridA?.current?.forceUpdateGrids();
    }
  }, []);

  const onRowMouseEnterCell = useCallback((isBelow, rowIndex, e) => {
    onRowMouseChangeIndex(isBelow, rowIndex);
  }, []);

  const onRowMouseLeave = useCallback((isBelow, e) => {
    onRowMouseChangeIndex(isBelow, null);
  }, []);

  const cellRenderer = useCallback(
    (
      isBelow,
      columnsList,
      dataList,
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
        if (columnsList) {
          let data = dataList;
          if (data) {
            let d1 = data[row];
            if (d1) {
              let value1 = d1[col];

              if (tableType === TableType.Deletions || tableType === TableType.Duplicates) {
                const colName = (sortedColumnNames ?? [])[col];
                const realCol = colName ? edaDataConsistency?.columnNames.indexOf(colName) : -1;
                if (realCol >= 0) {
                  value1 = d1[realCol];
                }
              }

              return value1 || '';
            }
          }
        }
        return '';
      };

      if (rowIndex === 0) {
        columnIndex++;
        content = 'Col: ' + columnIndex;
        if (columnsList) {
          content = columnsList[columnIndex - 1]?.title || '-';
        }
      } else {
        columnIndex++;

        content = getValue(rowIndex - 1, columnIndex - 1);
        if (content == null) {
          if (isScrolling) {
            content = '...';
          }
        }
      }

      let styleF = _.assign({}, style || {}, { overflow: 'hidden', padding: '0 3px' });
      styleF.backgroundColor = rowIndex === 0 ? '#23305e' : '#19232f';
      styleF.borderBottom = '1px solid #0b121b';
      if ((isBelow ? rowHoverBelow : rowHoverAbove) === rowIndex) {
        styleF.backgroundColor = '#284192';
        styleF.cursor = 'pointer';
      }
      if ((isBelow ? rowSelectBelow : rowSelectAbove) === rowIndex) {
        styleF.backgroundColor = '#346235';
      }

      return (
        <div key={key} style={styleF} className={s.Cell + ' '} onClick={onClickRow.bind(null, isBelow, rowIndex)} onMouseEnter={onRowMouseEnterCell.bind(null, isBelow, rowIndex === 0 ? null : rowIndex)}>
          {content}
        </div>
      );
    },
    [rowSelectBelow, rowSelectAbove, rowHoverAbove, rowHoverBelow, edaDataConsistency, sortedColumnNames],
  );

  const onChangeShowType = (e) => {
    setShowType(e.target.value);

    setRowHoverAbove(null);
    setRowHoverBelow(null);
    setRowSelectAbove(null);
    setRowSelectBelow(null);

    setShowDetail(false);

    refGridB?.current?.forceUpdateGrids();
    refGridA?.current?.forceUpdateGrids();
  };

  const detailWW = 400;

  const firstColumnIndex = useMemo(() => {
    const firstColumn = sortedColumnNames.length > 0 ? sortedColumnNames[0] : null;
    return edaDataConsistency?.columnNames && firstColumn ? edaDataConsistency?.columnNames.indexOf(firstColumn) : -1;
  }, [edaDataConsistency, sortedColumnNames]);

  const sortByPrimary = useCallback(
    (x, y) => {
      if (!_.isArray(x) || !_.isArray(y)) return 0;
      if (x.length <= firstColumnIndex || y.length <= firstColumnIndex) return 0;

      if (x[firstColumnIndex] < y[firstColumnIndex]) return -1;
      if (x[firstColumnIndex] > y[firstColumnIndex]) return 1;

      return 0;
    },
    [firstColumnIndex],
  );

  const calcLower = useCallback(() => {
    if (tableType === TableType.DataVariations) {
      return edaDataConsistency?.transformations?.[featureName]?.samples ?? [];
    }

    if (tableType === TableType.Deletions) {
      return (edaDataConsistency?.deletions?.sample ?? []).sort(sortByPrimary);
    }

    return (edaDataConsistency?.baseDuplicates?.sample ?? []).sort(sortByPrimary);
  }, [edaDataConsistency, featureName, tableType, sortByPrimary]);

  const calcCols = useCallback(() => {
    return columns;
  }, [columns]);

  const calcUpper = useCallback(() => {
    if (tableType !== TableType.Duplicates) {
      return [];
    }
    return (edaDataConsistency?.compareDuplicates?.sample ?? []).sort(sortByPrimary);
  }, [edaDataConsistency, tableType, sortByPrimary]);

  const renderSelRow = useMemo(() => {
    let res = [];

    let data1 = null,
      cols = null;
    if (rowSelectAbove == null) {
      data1 = calcLower()?.[rowSelectBelow - 1];
    } else {
      data1 = calcUpper()?.[rowSelectAbove - 1];
    }
    cols = calcCols();

    if (data1 == null || cols == null) {
      return null;
    }

    cols?.some((c1, c1ind) => {
      let n1 = (c1 as ITableExtColumn)?.title;
      let k1 = (c1 as ITableExtColumn)?.field as string;

      let style1: CSSProperties = { padding: '6px', border: '2px solid transparent', borderRadius: '3px', color: Utils.colorAall(1), marginTop: '10px', fontSize: '14px' };

      let v1 = data1?.[c1ind];
      if (_.isObject(v1)) {
        v1 = '' + v1;
      }

      res.push(
        <div key={'v1ch' + k1} style={{ paddingBottom: '10px', borderBottom: '1px solid ' + Utils.colorA(0.2) }}>
          <div style={style1}>
            <div style={{}}>
              <b>{n1}</b>
            </div>
            <div style={{ marginTop: '4px', color: Utils.colorA(0.7) }}>{v1}</div>
          </div>
        </div>,
      );
    });

    return <div>{res}</div>;
  }, [rowSelectBelow, rowSelectAbove, columns, calcCols, calcLower, calcUpper]);

  let lenBelow: any = calcLower()?.length;
  let hasBelow = !(lenBelow == null || lenBelow === 0);
  let lenAbove: any = calcUpper()?.length;
  let hasAbove = !(lenAbove == null || lenAbove === 0);

  const isRefreshing = !edaDataConsistency;

  let isNotYetUse = true;
  if (tableType === TableType.Duplicates) {
    isNotYetUse =
      !edaDataConsistency ||
      (edaDataConsistency?.baseDuplicates?.sample == null && edaDataConsistency.compareDuplicates?.sample == null) ||
      (edaDataConsistency?.baseDuplicates?.sample?.length === 0 && edaDataConsistency?.compareDuplicates?.sample?.length === 0);
  } else if (tableType === TableType.Deletions) {
    isNotYetUse = !edaDataConsistency || edaDataConsistency?.deletions?.sample == null || edaDataConsistency?.deletions?.sample?.length === 0;
  } else if (tableType === TableType.DataVariations) {
    isNotYetUse = !edaDataConsistency || !featureName || edaDataConsistency?.transformations?.[featureName]?.sample == null || edaDataConsistency?.transformations?.[featureName]?.sample?.length === 0;
  }

  const optionsFeatures = useMemo(() => {
    return (edaDataConsistency?.transformationColumnNames ?? []).map((colName) => ({ label: colName, value: colName }));
  }, [edaDataConsistency]);

  const onChangeFeature = (option) => {
    setFeatureName(option?.value);
  };

  useEffect(() => {
    if (!featureNameUsed && tableType === TableType.DataVariations && optionsFeatures && optionsFeatures.length > 0) {
      setFeatureName(optionsFeatures[0]?.value);
    }
  }, [tableType, featureNameUsed, optionsFeatures]);

  const optionsEDA = useMemo(() => {
    return (edaList ?? []).filter((item) => _.isArray(item.edaConfigs) && item.edaConfigs.map((config) => config.edaType)?.includes('DATA_CONSISTENCY'))?.map((item) => ({ label: item.name, value: item.edaId }));
  }, [edaList]);

  const onChangeDropdownEDASel = (option) => {
    if (option?.value) {
      let type = '1';
      if (tableType === TableType.Deletions) {
        type = '2';
      } else if (tableType === TableType.DataVariations) {
        type = '3';
      }
      Location.push('/' + PartsLink.exploratory_data_analysis_data_consistency_analysis + '/' + projectId + '/' + option?.value + '?tableType=' + type);
    }
  };

  const optionsVersion = useMemo(() => {
    return (edaVersionList ?? []).map((item) => ({ label: item.edaVersion, value: item.edaVersion }));
  }, [edaVersionList]);

  const onChangeDropdownVersionSel = (option) => {
    setVersion(option?.value);
  };

  const optionsTableType = [
    { label: TableType.Duplicates, value: TableType.Duplicates },
    { label: TableType.Deletions, value: TableType.Deletions },
    { label: TableType.DataVariations, value: TableType.DataVariations },
  ];

  const onChangeDropdownTableTypeSel = (option) => {
    setTableType(option?.value);
  };

  return (
    <div
      css={`
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      `}
    >
      <div className={sd.titleTopHeaderAfter} style={{ margin: '20px', height: topAfterHeaderHH, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
        <span style={{ whiteSpace: 'nowrap' }} className={sd.classScreenTitle}>
          <span>EDA Data Consistency Analysis</span>
        </span>
        <div
          css={`
            flex: 1;
          `}
        ></div>
      </div>
      <div css="display: flex; align-items: center; margin: 20px;">
        <span css="font-size: 14px">EDA:</span>
        <span style={{ marginLeft: '10px', marginRight: '20px', width: '300px', display: 'inline-block', fontSize: '12px' }}>
          <SelectExt value={optionsEDA?.find((v1) => v1.value === edaId)} options={optionsEDA} onChange={onChangeDropdownEDASel} />
        </span>
        <span css="font-size: 14px">Version:</span>
        <span style={{ marginLeft: '10px', marginRight: '20px', width: '200px', display: 'inline-block', fontSize: '12px' }}>
          <SelectExt value={optionsVersion?.find((v1) => v1.value === version)} options={optionsVersion} onChange={onChangeDropdownVersionSel} />
        </span>
        <span css="font-size: 14px">Table Type:</span>
        <span style={{ marginLeft: '10px', width: '200px', display: 'inline-block', fontSize: '12px' }}>
          <SelectExt value={optionsTableType?.find((v1) => v1.value === tableType)} options={optionsTableType} onChange={onChangeDropdownTableTypeSel} />
        </span>
      </div>
      <div
        css={`
          position: absolute;
          top: ${topAfterHeaderHH + 80}px;
          left: 0;
          right: 0;
          bottom: 0;
        `}
      >
        <NanoScroller onlyVertical>
          <div>
            {
              <div>
                {tableType === TableType.DataVariations && (
                  <div
                    css={`
                      font-family: Matter;
                      font-size: 18px;
                      font-weight: 500;
                      line-height: 1.78;
                      margin-left: 20px;
                      margin-top: 20px;
                      display: flex;
                      align-items: center;
                    `}
                  >
                    <span
                      css={`
                        white-space: nowrap;
                      `}
                    >
                      Transformation Column:
                    </span>
                    <span
                      css={`
                        font-size: 14px;
                        margin-left: 10px;
                      `}
                    >
                      <span
                        css={`
                          width: 200px;
                          display: inline-block;
                        `}
                      >
                        <SelectExt options={optionsFeatures} value={optionsFeatures?.find((v1) => v1.value === featureName)} onChange={onChangeFeature} />
                      </span>
                    </span>
                  </div>
                )}

                {tableType === TableType.Deletions && (
                  <div
                    css={`
                      font-family: Matter;
                      font-size: 18px;
                      font-weight: 500;
                      line-height: 1.78;
                      margin-left: 20px;
                      margin-top: 25px;
                    `}
                  >
                    Deletions
                  </div>
                )}

                {tableType === TableType.Duplicates && (
                  <div
                    css={`
                      font-family: Matter;
                      font-size: 18px;
                      font-weight: 500;
                      line-height: 1.78;
                      margin-top: 20px;
                      display: flex;
                      align-items: center;
                    `}
                  >
                    {
                      <span
                        css={`
                          margin-left: 20px;
                          white-space: nowrap;
                        `}
                      >
                        <StyleLabel>Show:</StyleLabel>
                      </span>
                    }
                    {
                      <span
                        css={`
                          font-size: 14px;
                          margin-left: 10px;
                        `}
                      >
                        <Radio.Group value={showType} onChange={onChangeShowType}>
                          <Radio
                            value={''}
                            css={`
                              margin: 10px 0;
                              font-size: 14px;
                            `}
                          >
                            <span
                              css={`
                                font-weight: normal;
                                color: white;
                              `}
                            >
                              Both
                            </span>
                          </Radio>
                          <Radio
                            value={'B'}
                            css={`
                              margin: 10px 0;
                              font-size: 14px;
                            `}
                          >
                            <span
                              css={`
                                font-weight: normal;
                                color: white;
                              `}
                            >
                              Test
                            </span>
                          </Radio>
                          <Radio
                            value={'A'}
                            css={`
                              margin: 10px 0;
                              font-size: 14px;
                            `}
                          >
                            <span
                              css={`
                                font-weight: normal;
                                color: white;
                              `}
                            >
                              Reference
                            </span>
                          </Radio>
                        </Radio.Group>
                      </span>
                    }
                  </div>
                )}
              </div>
            }

            <div
              css={`
                display: flex;
                margin: 20px;
                top: 50px;
              `}
              className={sd.absolute}
            >
              <div
                css={`
                  flex: 1;
                  margin-right: 5px;
                `}
              >
                <div css={``}>
                  <div css={``}>
                    <RefreshAndProgress isMsgAnimRefresh={isRefreshing} msgTop={isNotYetUse ? 25 : undefined} msgMsg={isRefreshing ? 'Processing...' : isNotYetUse ? 'No Data' : undefined} isDim={isNotYetUse || isRefreshing}>
                      <AutoSizer>
                        {({ height, width }) => {
                          const showBoth = showType === '' && hasBelow && hasAbove;
                          const showBelow = showType === 'B' || (hasBelow && !hasAbove);
                          const showAbove = showType === 'A' || (!hasBelow && hasAbove);

                          let hh2 = showBoth ? Math.trunc(height / 2) - 20 : height;
                          const topHH = 50;

                          if (showDetail) {
                            width -= detailWW;
                          }

                          return (
                            <div
                              css={`
                                width: ${width}px;
                                height: ${height}px;
                              `}
                            >
                              {(showBelow || showBoth) && (
                                <div
                                  css={`
                                    left: 0;
                                    right: 0;
                                    top: 0;
                                    height: ${hh2}px;
                                  `}
                                >
                                  {tableType === TableType.Duplicates && (
                                    <div
                                      css={`
                                        font-family: Matter;
                                        font-size: 18px;
                                        font-weight: 500;
                                        line-height: 1.78;
                                        margin-top: 10px;
                                        margin-bottom: 10px;
                                      `}
                                    >
                                      Test Version Duplicate Rows
                                    </div>
                                  )}

                                  <div
                                    css={`
                                      height: ${hh2 - topHH}px;
                                      position: relative;
                                    `}
                                    onMouseLeave={onRowMouseLeave.bind(null, true)}
                                  >
                                    <MultiGrid
                                      ref={refGridB}
                                      cellRenderer={cellRenderer.bind(null, true, calcCols(), calcLower())}
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
                                      columnCount={calcCols()?.length ?? 0}
                                      columnWidth={140}
                                      height={hh2 - topHH}
                                      rowCount={(calcLower()?.length ?? 0) + 1}
                                      rowHeight={cellHH}
                                      width={width}
                                    />
                                  </div>
                                </div>
                              )}

                              {(showAbove || showBoth) && (
                                <div
                                  css={`
                                    left: 0;
                                    right: 0;
                                    bottom: 0;
                                    height: ${hh2}px;
                                  `}
                                >
                                  <div
                                    css={`
                                      font-family: Matter;
                                      font-size: 18px;
                                      font-weight: 500;
                                      line-height: 1.78;
                                      margin-top: 10px;
                                      margin-bottom: 10px;
                                    `}
                                  >
                                    Reference Version Duplicate Rows
                                  </div>

                                  <div
                                    css={`
                                      height: ${hh2 - topHH}px;
                                      position: relative;
                                    `}
                                    onMouseLeave={onRowMouseLeave.bind(null, false)}
                                  >
                                    <MultiGrid
                                      ref={refGridA}
                                      cellRenderer={cellRenderer.bind(null, false, calcCols(), calcUpper())}
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
                                      columnCount={calcCols()?.length ?? 0}
                                      columnWidth={140}
                                      height={hh2 - topHH}
                                      rowCount={(calcUpper()?.length ?? 0) + 1}
                                      rowHeight={cellHH}
                                      width={width}
                                    />
                                  </div>
                                </div>
                              )}

                              {showDetail && (
                                <div style={{ position: 'absolute', top: 0, width: detailWW + 'px', bottom: 0, right: 0 + 'px', borderLeft: '1px solid ' + Utils.colorA(0.2), borderRight: '1px solid ' + borderAAA }}>
                                  <div style={STYLE_DETAIL_HEADER}>Detail Row: {rowSelectAbove ?? rowSelectBelow}</div>
                                  <div style={{ position: 'absolute', top: cellHH + 'px', left: '15px', bottom: 0, right: '15px' }}>
                                    <NanoScroller onlyVertical ref={refDetailScroll}>
                                      <div>{renderSelRow}</div>
                                    </NanoScroller>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }}
                      </AutoSizer>
                    </RefreshAndProgress>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </NanoScroller>
      </div>
    </div>
  );
});

export default EDADataConsistencyAnalysis;
