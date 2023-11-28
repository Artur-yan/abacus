import Radio from 'antd/lib/radio';
import * as _ from 'lodash';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import MultiGrid from 'react-virtualized/dist/commonjs/MultiGrid';
import styled from 'styled-components';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import { useDocStoreFromMonitor, useDocStoreFromProject, useFeatureGroup, useFeaturesForFeatureGroup, useProject } from '../../api/REUses';
import Constants from '../../constants/Constants';
import batchPred, { BatchPredLifecycle } from '../../stores/reducers/batchPred';
import monitoring, { ModelMonitoringLifecycle } from '../../stores/reducers/monitoring';
import DateOld from '../DateOld/DateOld';
import HelpBox from '../HelpBox/HelpBox';
import Link from '../Link/Link';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./MonitorOutliers.module.css');
const sd = require('../antdUseDark.module.css');

interface IMonitorOutliersProps {
  isBP?: boolean;
}

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

export interface IOutliers {
  upper?: any[];
  lower?: any[];

  unseen?: any[];
  uncommon?: any[];

  overall?: any[];
}

const MonitorOutliers = React.memo((props: PropsWithChildren<IMonitorOutliersProps>) => {
  const { batchPredParam, paramsProp, authUser, monitoringParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    monitoringParam: state.monitoring,
    batchPredParam: state.batchPred,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const [summary, setSummary] = useState(
    null as {
      targetColumn?: string;
      predictionDrift?: number;
      featureIndex: { distance; name: string; noOutliers }[];
      nullViolations: { name: string; predictionNullFreq; trainingNullFreq; violation: string }[];
      rangeViolations: { name: string; freqAboveTrainingRange; freqBelowTrainingRange; predictionMax; predictionMin; trainingMax; trainingMin }[];
      typeViolations: { name: string; predictionDataType: string; trainingDataType: string }[];
      catViolations?: { freqOutsideTrainingRange: number; mostCommonValues: any[]; name }[];
      nestedSummary?: any[];
    },
  );
  const [outliers, setOutliers] = useState(null as IOutliers);
  const [isNotYet, setIsNotYet] = useState(false);
  const [isNotYetOverall, setIsNotYetOverall] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showType, setShowType] = useState('');
  const [featureName, setFeatureName] = useState(null);
  const [isLowerUpper, setIsLowerUpper] = useState(true);
  const [overallView, setOverallView] = useState(false);
  const [byValue, setByValue] = useState(null);
  const [byValueSel, setByValueSel] = useState(null);

  const projectId = paramsProp?.get('projectId');
  const modelMonitorId = paramsProp?.get('modelMonitorId');
  const modelMonitorVersion = paramsProp?.get('useModelMonitorVersion');

  const isBP = !!props.isBP;

  const projectOne = useProject(projectId);
  const docStoreDefOri = useDocStoreFromProject(projectOne);

  useEffect(() => {
    monitoring.memModelsById(true, modelMonitorId);
  }, [modelMonitorId, monitoringParam]);
  const monitorOne = useMemo(() => {
    return monitoring.memModelsById(false, modelMonitorId);
  }, [modelMonitorId, monitoringParam]);

  const docStoreDefMonitor = useDocStoreFromMonitor(monitorOne);

  const docStoreDef = docStoreDefMonitor ?? docStoreDefOri;

  useEffect(() => {
    batchPred.memBatchList(undefined, projectId, null, true);
  }, [projectId, batchPredParam]);
  const batchList = useMemo(() => {
    return batchPred.memBatchList(undefined, projectId, null, false);
  }, [projectId, batchPredParam]);

  const uBId1 = paramsProp?.get('useBatchPredId');
  const useBatchPredId = useMemo(() => {
    let res = uBId1;
    if (Utils.isNullOrEmpty(res)) {
      res = batchList?.[0]?.batchPredictionId;
    }
    return res;
  }, [uBId1, batchList]);

  useEffect(() => {
    batchPred.memBatchListVersions(undefined, useBatchPredId, true);
  }, [useBatchPredId, batchPredParam]);
  const batchVersionList = useMemo(() => {
    return batchPred.memBatchListVersions(undefined, useBatchPredId, false);
  }, [useBatchPredId, batchPredParam]);

  const uBVer1 = paramsProp?.get('useBatchPredVersion');
  const useBatchPredVersion = useMemo(() => {
    let res = uBVer1;
    if (Utils.isNullOrEmpty(res)) {
      res = batchVersionList?.[0]?.batchPredictionVersion;
    }
    return res;
  }, [uBVer1, batchVersionList]);

  let hasOverall = outliers?.overall != null && outliers?.overall?.length > 0;
  const isShowOverall = showType === 'O';
  const isOnlyOverall = hasOverall && isNotYet;

  let isVisionDrift = monitorOne?.monitorType?.toUpperCase() === 'VISION_DRIFT_MONITOR' || monitorOne?.monitorType?.toUpperCase() === 'NLP_DRIFT_MONITOR';
  const forceOnlyOverall = isVisionDrift === true;

  useEffect(() => {
    if (forceOnlyOverall) {
      setOverallView(true);
    }
  }, [forceOnlyOverall]);

  useEffect(() => {
    monitoring.memModelVersionsById(true, modelMonitorId);
  }, [modelMonitorId, monitoringParam]);
  const monitorVersionsOne = useMemo(() => {
    return monitoring.memModelVersionsById(false, modelMonitorId);
  }, [modelMonitorId, monitoringParam]);

  const isVersionTraining = useMemo(() => {
    if (monitorVersionsOne?.length > 0) {
      const modelMonitorVersionOne = monitorVersionsOne?.find((v1) => v1.modelMonitorVersion === modelMonitorVersion);
      return [ModelMonitoringLifecycle.MONITORING, ModelMonitoringLifecycle.PENDING].includes(modelMonitorVersionOne?.status);
    }

    return false;
  }, [monitorVersionsOne, modelMonitorVersion]);

  const onChangeVersion = (option1) => {
    Location.push('/' + paramsProp.get('mode') + '/' + modelMonitorId + '/' + projectId, undefined, 'useModelMonitorVersion=' + encodeURIComponent(option1?.value ?? ''));
  };

  useEffect(() => {
    if (monitorVersionsOne?.length > 0) {
      let v1 = monitorVersionsOne?.[0]?.modelMonitorVersion;
      if (Utils.isNullOrEmpty(modelMonitorVersion) && v1) {
        onChangeVersion({ label: '', value: v1 });
      }
    }
  }, [monitorVersionsOne, modelMonitorVersion]);
  const optionsVersions = useMemo(() => {
    if (monitorVersionsOne) {
      return monitorVersionsOne?.map((v1, v1ind) => ({ label: v1?.modelMonitorVersion, value: v1?.modelMonitorVersion, data: v1 }));
    }
  }, [monitorVersionsOne]);

  const findFeature = paramsProp?.get('findFeature');

  useEffect(() => {
    if (!Utils.isNullOrEmpty(findFeature)) {
      setFeatureName((fn1) => {
        fn1 = findFeature;
        return fn1;
      });
    }
  }, [findFeature]);

  const getMergedFeatureIndex = (featureIndex, nestedSummary) => {
    let mergedFeatureIndex = [...featureIndex];
    nestedSummary?.forEach((nestedItem) => {
      mergedFeatureIndex.push(
        ...nestedItem.featureIndex?.map((featureItem) => {
          return { ...featureItem, name: `${nestedItem.nestedFeatureName};${featureItem.name}` };
        }),
      );
    });

    return mergedFeatureIndex;
  };

  const optionsFeatures = useMemo(() => {
    const featureIndex = getMergedFeatureIndex(summary?.featureIndex ?? [], summary?.nestedSummary ?? []);
    let res = featureIndex?.filter((f1) => f1.noOutliers !== true)?.map((f1) => ({ label: f1.name, value: f1.name, data: f1 }));

    if (summary?.targetColumn && res != null) {
      let ind1 = _.findIndex(res, (r1) => r1.value === summary?.targetColumn);
      if (ind1 > -1) {
        let p1 = res[ind1];
        res.splice(ind1, 1);
        res.unshift(p1);
      }
    }

    if (res != null && res.length > 0) {
      setFeatureName((id1) => {
        if (id1 == null) {
          if (!Utils.isNullOrEmpty(paramsProp?.get('findFeature'))) {
            id1 = paramsProp?.get('findFeature');
          } else {
            id1 = res?.[0]?.value;
          }
        }
        return id1;
      });
    } else {
      setIsNotYet(true);
    }
    return res;
  }, [summary]);

  useEffect(() => {
    if (!modelMonitorVersion && !useBatchPredVersion) {
      return;
    }

    setByValueSel(undefined);
    setIsNotYet(false);
    setShowType('');
    setShowDetail(false);
    setRowHoverAbove(null);
    setRowHoverBelow(null);
    setRowSelectAbove(null);
    setRowSelectBelow(null);

    const cb1 = (err, res) => {
      if (err || !res?.success) {
        setSummary(null);
      } else {
        setSummary(res?.result ?? null);
      }
    };

    if (isBP) {
      REClient_.client_()._getFeatureDriftBatchPredictionSummary(useBatchPredVersion, cb1);
    } else {
      REClient_.client_()._getFeatureDriftModelMonitorSummary(modelMonitorVersion, cb1);
    }
  }, [useBatchPredVersion, modelMonitorVersion, overallView, isBP, isVersionTraining]);

  useEffect(() => {
    if ((!modelMonitorVersion && !useBatchPredVersion) || (!featureName && !overallView)) {
      return;
    }

    setIsRefreshing(true);

    const cb1 = (err2, res2) => {
      setIsRefreshing(false);

      if (err2 || !res2?.success) {
        setOutliers(null);
        setIsNotYet(true);
      } else {
        let resAll = res2?.result;
        setOutliers(resAll ?? null);
        setIsNotYet(false);

        //test
        // let d1 = (v1) => ({ aaaa: v1, bbbbb: 34242342, aksdhkajd: 3434343, asdasdasda: 'axzcx', addaasdada: 'fefffe', });
        // let dd = (v1) => (new Array(30).fill(d1(v1)));

        // resAll = { overall: dd('overall'), unseen: dd('unssscommon'), uncommon: dd('cccc'), } as IOutliers;
        setOutliers(resAll);

        //
        if (resAll == null) {
          setIsNotYet(true);
          setIsLowerUpper(true);
          setIsNotYetOverall(true);
        } else {
          if (resAll?.unseen == null && resAll?.uncommon == null) {
            setIsLowerUpper(true);
            if ((resAll?.lower?.length === 0 && resAll?.upper?.length === 0) || (resAll?.lower == null && resAll?.upper == null)) {
              setIsNotYet(true);
            }
          }
          if (resAll?.lower == null && resAll?.upper == null) {
            setIsLowerUpper(false);
            if ((resAll?.unseen?.length === 0 && resAll?.uncommon?.length === 0) || (resAll?.unseen == null && resAll?.uncommon == null)) {
              setIsNotYet(true);
            }
          }

          if (resAll?.overall?.length === 0 || resAll?.overall == null) {
            setIsNotYetOverall(true);
          } else {
            setIsNotYetOverall(false);
          }

          setByValue(resAll?.byValue);
        }
      }
    };

    let featureName1 = featureName;
    let nestedFeatureName = null;
    if (featureName?.includes(';')) {
      const featureNames = featureName.split(';');
      nestedFeatureName = featureNames[0];
      featureName1 = featureNames[1];
    }

    if (isBP) {
      REClient_.client_().getOutliersForBatchPredictionFeature(useBatchPredVersion, overallView ? null : featureName1, nestedFeatureName, cb1);
    } else {
      REClient_.client_().getOutliersForFeature(modelMonitorVersion, overallView ? null : featureName1, nestedFeatureName, cb1);
    }
  }, [useBatchPredVersion, modelMonitorVersion, featureName, overallView, isBP, isVersionTraining]);

  const columnsUncommon = useMemo(() => {
    let kk = Object.keys(outliers?.uncommon?.[0] ?? {});

    if (!Utils.isNullOrEmpty(summary?.targetColumn)) {
      let ind1 = _.findIndex(kk, (k1) => k1 === summary?.targetColumn);
      if (ind1 > -1) {
        kk.splice(ind1, 1);
        kk.unshift(summary?.targetColumn);
      }
    }

    return kk.map((k1) => ({ width: 80, noAutoTooltip: true, title: k1, field: k1 })) as ITableExtColumn[];
  }, [outliers, summary]);

  const columnsUnseen = useMemo(() => {
    let kk = Object.keys(outliers?.unseen?.[0] ?? {});

    if (!Utils.isNullOrEmpty(summary?.targetColumn)) {
      let ind1 = _.findIndex(kk, (k1) => k1 === summary?.targetColumn);
      if (ind1 > -1) {
        kk.splice(ind1, 1);
        kk.unshift(summary?.targetColumn);
      }
    }

    return kk.map((k1) => ({ width: 80, noAutoTooltip: true, title: k1, field: k1 })) as ITableExtColumn[];
  }, [outliers, summary]);

  const columnsUpper = useMemo(() => {
    let kk = Object.keys(outliers?.upper?.[0] ?? {});

    if (!Utils.isNullOrEmpty(summary?.targetColumn)) {
      let ind1 = _.findIndex(kk, (k1) => k1 === summary?.targetColumn);
      if (ind1 > -1) {
        kk.splice(ind1, 1);
        kk.unshift(summary?.targetColumn);
      }
    }

    return kk.map((k1) => ({ width: 80, noAutoTooltip: true, title: k1, field: k1 })) as ITableExtColumn[];
  }, [outliers, summary]);

  const columnsOverall = useMemo(() => {
    let kk = Object.keys(outliers?.overall?.[0] ?? {});

    if (!Utils.isNullOrEmpty(summary?.targetColumn)) {
      let ind1 = _.findIndex(kk, (k1) => k1 === summary?.targetColumn);
      if (ind1 > -1) {
        kk.splice(ind1, 1);
        kk.unshift(summary?.targetColumn);
      }
    }

    return kk.map((k1) => ({ width: 80, noAutoTooltip: true, title: k1, field: k1 })) as ITableExtColumn[];
  }, [outliers, summary]);

  const columnsLower = useMemo(() => {
    let kk = Object.keys(outliers?.lower?.[0] ?? {});

    if (!Utils.isNullOrEmpty(summary?.targetColumn)) {
      let ind1 = _.findIndex(kk, (k1) => k1 === summary?.targetColumn);
      if (ind1 > -1) {
        kk.splice(ind1, 1);
        kk.unshift(summary?.targetColumn);
      }
    }

    return kk.map((k1) => ({ width: 80, noAutoTooltip: true, title: k1, field: k1 })) as ITableExtColumn[];
  }, [outliers, summary]);

  const columnsByValue = useMemo(() => {
    let kk = Object.keys(byValue?.[byValueSel]?.[0] ?? {});

    if (!Utils.isNullOrEmpty(featureName)) {
      let ind1 = _.findIndex(kk, (k1) => k1 === featureName);
      if (ind1 > -1) {
        kk.splice(ind1, 1);
        kk.unshift(featureName);
      }
    }

    if (!Utils.isNullOrEmpty(summary?.targetColumn)) {
      let ind1 = _.findIndex(kk, (k1) => k1 === summary?.targetColumn);
      if (ind1 > -1) {
        kk.splice(ind1, 1);
        kk.unshift(summary?.targetColumn);
      }
    }

    return kk.map((k1) => ({ width: 80, noAutoTooltip: true, title: k1, field: k1 })) as ITableExtColumn[];
  }, [outliers, summary, byValue, byValueSel, featureName]);

  const [rowSelectBelow, setRowSelectBelow] = useState(null);
  const [rowHoverBelow, setRowHoverBelow] = useState(null);
  const [rowSelectAbove, setRowSelectAbove] = useState(null);
  const [rowHoverAbove, setRowHoverAbove] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const refGridB = useRef(null);
  const refGridA = useRef(null);
  const refDetailScroll = useRef(null);

  const onClickRow = useCallback((isOverall, isBelow, rowIndex, e) => {
    if (rowIndex < 1) {
      return;
    }

    setShowType(isOverall ? 'O' : isBelow ? 'B' : 'A');
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

  const onClickGoByValue = useCallback((byValue1, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    setByValueSel(byValue1);
  }, []);

  const cellRenderer = useCallback(
    (
      colDocStore2,
      colIMAGE,
      docStoreDef,
      colImageNameList,
      isOverall,
      isBelow,
      columnsList,
      dataList,
      featureName,
      byValueList,
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
          let colName = columnsList?.[col]?.field;
          if (colName) {
            let data = dataList;
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
        if (false && columnIndex === 0) {
          content = '';
        } else {
          columnIndex++;
          content = 'Col: ' + columnIndex;
          if (columnsList) {
            content = columnsList[columnIndex - 1]?.title || '-';
          }
        }
      } else {
        columnIndex++;
        if (false && columnIndex === 0) {
          content = '' + rowIndex;
        } else {
          content = getValue(rowIndex - 1, columnIndex - 1);
          if (content == null) {
            if (isScrolling) {
              content = '...';
            }
          } else {
            if (colImageNameList?.find((s1) => s1?.toLowerCase() === columnsList?.[columnIndex - 1]?.field?.toLowerCase()) != null) {
              content =
                docStoreDef?.renderOne?.({ docId: content }, [
                  'docId',
                  /*columnsList?.[columnIndex-1]?.field, colDocStore2*/
                ]) ?? null;
            } else if (columnsList?.[columnIndex - 1]?.field === featureName) {
              if (byValueList?.includes(content)) {
                content = (
                  <span className={sd.linkBlue} onClick={onClickGoByValue.bind(null, content)}>
                    {content}
                  </span>
                );
              }
            }
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
        <div key={key} style={styleF} className={s.Cell + ' '} onClick={onClickRow.bind(null, isOverall, isBelow, rowIndex)} onMouseEnter={onRowMouseEnterCell.bind(null, isBelow, rowIndex === 0 ? null : rowIndex)}>
          {content}
        </div>
      );
    },
    [rowSelectBelow, rowSelectAbove, rowHoverAbove, rowHoverBelow, onClickGoByValue],
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
  let isByValue = byValueSel != null;

  const calcLower = useCallback(
    (forceNoOverall = false) => {
      if (!forceNoOverall) {
        if (isShowOverall || isOnlyOverall) {
          return outliers?.overall;
        }
      }
      if (isByValue) {
        return byValue?.[byValueSel];
      }
      return isLowerUpper ? outliers?.lower : outliers?.unseen;
    },
    [outliers, isLowerUpper, isShowOverall, isOnlyOverall, isByValue, byValueSel, byValue],
  );

  useEffect(() => {
    if (byValue) {
      if (isShowOverall || isOnlyOverall) {
        setIsNotYet(false);
      } else if (byValue?.[byValueSel] == null) {
        setIsNotYet(true);
      } else {
        setIsNotYet(false);
      }
    }
  }, [byValue, byValueSel, isShowOverall, isOnlyOverall]);

  const calcLowerCols = useCallback(() => {
    if (isShowOverall || isOnlyOverall) {
      return columnsOverall;
    }
    if (isByValue) {
      return columnsByValue;
    }
    return isLowerUpper ? columnsLower : columnsUnseen;
  }, [columnsLower, columnsUnseen, isLowerUpper, isShowOverall, isOnlyOverall, columnsByValue, isByValue]);

  const calcUpper = useCallback(() => {
    if (isByValue) {
      return null;
    }
    return isLowerUpper ? outliers?.upper : outliers?.uncommon;
  }, [outliers, isLowerUpper, isByValue]);

  const calcUpperCols = useCallback(() => {
    if (isByValue) {
      return null;
    }
    return isLowerUpper ? columnsUpper : columnsUncommon;
  }, [columnsUpper, columnsUncommon, isLowerUpper, isByValue]);

  const renderSelRow = useMemo(() => {
    let res = [];

    let data1 = null,
      cols = null;
    if (rowSelectAbove == null) {
      data1 = calcLower()?.[rowSelectBelow - 1];
      cols = calcLowerCols();
    } else {
      data1 = calcUpper()?.[rowSelectAbove - 1];
      cols = calcUpperCols();
    }

    if (data1 == null || cols == null) {
      return null;
    }

    cols?.some((c1, c1ind) => {
      let n1 = (c1 as ITableExtColumn)?.title;
      let k1 = (c1 as ITableExtColumn)?.field as string;

      let style1: CSSProperties = { padding: '6px', border: '2px solid transparent', borderRadius: '3px', color: Utils.colorAall(1), marginTop: '10px', fontSize: '14px' };
      // if(''+selCol===''+k1) {
      //   style1.border = '2px solid #448044';
      // }

      let v1 = data1?.[k1];
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
  }, [rowSelectBelow, rowSelectAbove, columnsUpper, columnsLower, calcLower, calcLowerCols, calcUpper, calcUpperCols, isByValue, byValue, byValueSel]);

  const onChangeFeatureSel = (option1) => {
    setShowType('');
    setRowHoverAbove(null);
    setRowHoverBelow(null);
    setRowSelectAbove(null);
    setRowSelectBelow(null);
    setShowDetail(false);
    setFeatureName(option1?.value);
  };

  let lenBelow: any = calcLower()?.length;
  let hasBelow = !(lenBelow == null || lenBelow === 0);
  let lenAbove: any = calcUpper()?.length;
  let hasAbove = !(lenAbove == null || lenAbove === 0);
  let hasBoth = hasBelow && hasAbove;
  if (hasBelow && hasBoth) {
    let lenBelow2: any = calcLower(true)?.length;
    let hasBelow2 = !(lenBelow2 == null || lenBelow2 === 0);
    if (!isOnlyOverall && isShowOverall && !hasBelow2) {
      hasBoth = false;
    }
  }

  let hasBothOri = hasBoth;
  let hasBelowOri = hasBelow;
  let hasAboveOri = hasAbove;
  if (isShowOverall) {
    hasBoth = false;
    hasBelow = true;
    hasAbove = false;
  }

  const isNotYetUse = isShowOverall || isOnlyOverall ? isNotYetOverall : isNotYet;

  const onChangeOverallView = (e) => {
    setOverallView(e.target.value);
    setOutliers(null);
    setIsNotYetOverall(false);
    setIsNotYet(false);
    setByValueSel(undefined);
  };

  useEffect(() => {
    monitoring.memModelsByProjectId(true, projectId);
  }, [monitoringParam, projectId]);
  const monitorsList = useMemo(() => {
    return monitoring.memModelsByProjectId(false, projectId);
  }, [monitoringParam, projectId]);

  const optionsMonitors = useMemo(() => {
    return monitorsList?.map((v1, v1ind) => ({ label: v1?.name, value: v1?.modelMonitorId, data: v1 }));
  }, [monitorsList]);

  const onChangeMonitor = (option1) => {
    Location.push('/' + paramsProp?.get('mode') + '/' + option1?.value + '/' + projectId, undefined, Utils.processParamsAsQuery({ useModelMonitorVersion: null }, window.location.search));
  };

  const byValueList = useMemo(() => {
    return byValue == null ? null : Object.keys(byValue ?? {});
  }, [byValue]);

  const byValueOptions = useMemo(() => {
    let res = byValueList?.map((k1) => ({ label: k1, value: k1 }));
    res = res ?? [];
    res.unshift({ label: '(Not Selected)', value: undefined });
    return res;
  }, [byValueList, byValue]);

  useEffect(() => {
    setByValueSel((s1) => {
      if (byValueList == null || byValueList?.length === 0) {
        s1 = undefined;
      } else if (s1 == null || !byValueList?.includes(s1)) {
        s1 = undefined;
      }

      return s1;
    });
  }, [byValueList, byValue]);

  const onChangeByValueSel = (option1) => {
    setByValueSel(option1?.value);

    setTimeout(() => {
      refGridB?.current?.forceUpdateGrids();
      refGridA?.current?.forceUpdateGrids();
    }, 0);
  };

  const onChangeBatchPred = (option1) => {
    Location.push('/' + paramsProp?.get('mode') + '/' + projectId + '/-', undefined, Utils.processParamsAsQuery({ useBatchPredId: option1?.value, useBatchPredVersion: '' }, window.location.search));
  };

  const onChangeBatchPredVersion = (option1) => {
    Location.push('/' + paramsProp?.get('mode') + '/' + projectId + '/-', undefined, Utils.processParamsAsQuery({ useBatchPredVersion: option1?.value }, window.location.search));
  };

  const optionsBatchPred = useMemo(() => {
    return batchList?.map((b1) => ({ label: b1.name, value: b1.batchPredictionId }));
  }, [batchList]);
  const optionsBatchPredSel = optionsBatchPred?.find((b1) => b1.value === useBatchPredId) ?? { label: '', value: null };

  const optionsBatchPredVersion = useMemo(() => {
    return batchVersionList
      ?.filter((b1) => b1.predictionsCompletedAt != null && b1.predictionsCompletedAt !== 0)
      ?.filter((b1) => b1?.status?.toUpperCase() === BatchPredLifecycle.COMPLETE)
      ?.map((b1) => ({ label: <DateOld date={b1.predictionsCompletedAt} always />, value: b1.batchPredictionVersion }));
  }, [batchVersionList]);
  const optionsBatchPredVersionSel = optionsBatchPredVersion?.find((b1) => b1.value === useBatchPredVersion) ?? { label: '', value: null };

  const outliersShowImagesForMappings = docStoreDef?.outliersShowImagesForMappings ?? null;

  const featureGroupOnePred = useFeatureGroup(projectId, monitorOne?.predictionFeatureGroupId);
  const featuresIMAGEList = useFeaturesForFeatureGroup(featureGroupOnePred);

  const colImageNameList = useMemo(() => {
    let list1 = [...(outliersShowImagesForMappings ?? [])].map((s1) => s1?.toUpperCase());
    return featuresIMAGEList?.filter((f1) => list1?.includes(f1?.featureMapping?.toUpperCase()))?.map((f1) => f1?.name);
  }, [featuresIMAGEList, outliersShowImagesForMappings]);

  const renderFeatureMapping = docStoreDef?.renderFeatureMapping;
  const renderFeatureMapping2 = docStoreDef?.renderFeatureMapping2;

  const colIMAGE = useMemo(() => {
    let list = renderFeatureMapping?.map((s1) => s1?.toLowerCase());
    return featuresIMAGEList?.find((f1) => list?.includes(f1?.featureMapping?.toLowerCase()))?.name;
  }, [featuresIMAGEList, renderFeatureMapping]);
  const colDocStore2 = useMemo(() => {
    let list = renderFeatureMapping2?.map((s1) => s1?.toLowerCase());
    return featuresIMAGEList?.find((f1) => list?.includes(f1?.featureMapping?.toLowerCase()))?.name;
  }, [featuresIMAGEList, renderFeatureMapping2]);

  const testPrediction = useMemo(() => {
    return monitorOne?.monitorType === 'FEATURE_GROUP_MONITOR' ? 'Test' : 'Prediction';
  }, [monitorOne]);

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
          <span>Outliers Predictions{isBP ? ' BP' : ''}</span>
        </span>
        <div
          css={`
            flex: 1;
          `}
        ></div>
        <div>{<HelpBox name={'Monitoring'} beforeText={''} linkTo={'/help/modelMonitoring/creating_monitor'} />}</div>
      </div>
      <div
        css={`
          position: absolute;
          top: ${topAfterHeaderHH}px;
          left: 0;
          right: 0;
          bottom: 0;
        `}
      >
        <NanoScroller onlyVertical>
          <div>
            {
              <div>
                {!isBP && (
                  <div
                    css={`
                      font-family: Matter;
                      font-size: 18px;
                      font-weight: 500;
                      line-height: 1.78;
                      margin-left: 20px;
                      margin-top: 30px;
                      display: flex;
                      align-items: center;
                    `}
                  >
                    <span css={``}>Monitor:</span>
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
                        <SelectExt options={optionsMonitors} value={optionsMonitors?.find((v1) => v1.value === modelMonitorId)} onChange={onChangeMonitor} />
                      </span>
                    </span>

                    <span
                      css={`
                        margin-left: 20px;
                      `}
                    >
                      <StyleLabel>Version:</StyleLabel>
                    </span>
                    <span
                      css={`
                        font-size: 14px;
                        margin-left: 10px;
                      `}
                    >
                      <span
                        css={`
                          width: 140px;
                          display: inline-block;
                        `}
                      >
                        <SelectExt options={optionsVersions} value={optionsVersions?.find((v1) => v1.value === modelMonitorVersion)} onChange={onChangeVersion} />
                      </span>
                    </span>
                  </div>
                )}
                {isBP && (
                  <div
                    css={`
                      margin-bottom: 5px;
                      margin-top: 20px;
                    `}
                  >
                    <div
                      css={`
                        font-family: Matter;
                        font-size: 18px;
                        font-weight: 500;
                        line-height: 1.78;
                        margin-left: 20px;
                        margin-top: 10px;
                        display: flex;
                        align-items: center;
                      `}
                    >
                      <span>Batch Prediction:</span>
                      <div
                        css={`
                          margin-left: 5px;
                          width: 300px;
                          font-size: 14px;
                        `}
                      >
                        <SelectExt options={optionsBatchPred} value={optionsBatchPredSel} onChange={onChangeBatchPred} />
                      </div>
                      {useBatchPredId && (
                        <span
                          css={`
                            margin-left: 10px;
                            display: flex;
                            align-items: center;
                          `}
                        >
                          <Link to={'/' + PartsLink.batchpred_detail + '/' + (projectId ?? '-') + '/' + useBatchPredId} usePointer className={sd.styleTextBlueBright}>
                            (View)
                          </Link>
                        </span>
                      )}

                      <div
                        css={`
                          margin-left: 20px;
                        `}
                      >
                        &nbsp;
                      </div>

                      <span>Version:</span>
                      <div
                        css={`
                          margin-left: 5px;
                          width: 240px;
                          font-size: 14px;
                        `}
                      >
                        <SelectExt options={optionsBatchPredVersion} value={optionsBatchPredVersionSel} onChange={onChangeBatchPredVersion} />
                      </div>
                    </div>
                  </div>
                )}

                <div
                  css={`
                    font-family: Matter;
                    font-size: 18px;
                    font-weight: 500;
                    line-height: 1.78;
                    margin-top: 10px;
                    display: flex;
                    align-items: center;
                  `}
                >
                  {!forceOnlyOverall && (
                    <span
                      css={`
                        margin-left: 20px;
                      `}
                    >
                      <Radio.Group value={overallView} onChange={onChangeOverallView}>
                        {/*// @ts-ignore*/}
                        <Radio
                          value={true}
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
                            <StyleLabel>Overall</StyleLabel>
                          </span>
                        </Radio>
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
                            <StyleLabel>Feature{overallView ? '' : ':'}</StyleLabel>
                          </span>
                        </Radio>
                      </Radio.Group>
                    </span>
                  )}
                  {!overallView && (
                    <span
                      css={`
                        font-size: 14px;
                        margin-left: 10px;
                        width: 260px;
                      `}
                    >
                      <SelectExt options={optionsFeatures} value={optionsFeatures?.find((f1) => f1.value === featureName)} onChange={onChangeFeatureSel} />
                    </span>
                  )}

                  {(hasBothOri || hasOverall) && !isOnlyOverall && (
                    <span
                      css={`
                        margin-left: 20px;
                      `}
                    >
                      <StyleLabel>Show:</StyleLabel>
                    </span>
                  )}
                  {(hasBothOri || hasOverall) && !isOnlyOverall && (
                    <span
                      css={`
                        font-size: 14px;
                        margin-left: 10px;
                      `}
                    >
                      <Radio.Group value={hasOverall && !hasBothOri ? (showType === 'O' ? 'O' : '') : showType} onChange={onChangeShowType}>
                        {/*// @ts-ignore*/}
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
                            {hasBothOri ? 'Both' : 'Outliers'}
                          </span>
                        </Radio>
                        {/*// @ts-ignore*/}
                        {hasBothOri && (
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
                              {isLowerUpper ? 'Below' : 'Unseen'}
                            </span>
                          </Radio>
                        )}
                        {/*// @ts-ignore*/}
                        {hasBothOri && (
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
                              {isLowerUpper ? 'Above' : 'Uncommon'}
                            </span>
                          </Radio>
                        )}

                        {hasOverall && (
                          <span
                            css={`
                              color: white;
                              margin: 0 7px 9px 2px;
                              border-left: 1px solid rgba(255, 255, 255, 0.6);
                              display: inline-block;
                              height: 18px;
                              vertical-align: middle;
                            `}
                          ></span>
                        )}

                        {/*// @ts-ignore*/}
                        {hasOverall && (
                          <Radio
                            value={'O'}
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
                              {'Overall'}
                            </span>
                          </Radio>
                        )}
                      </Radio.Group>
                    </span>
                  )}

                  {byValueOptions != null && !overallView && (
                    <span
                      css={`
                        margin-left: 20px;
                      `}
                    >
                      <StyleLabel>By Value:</StyleLabel>
                    </span>
                  )}
                  {byValueOptions != null && !overallView && (
                    <span
                      css={`
                        font-size: 14px;
                        margin-left: 10px;
                        width: 260px;
                      `}
                    >
                      <SelectExt options={byValueOptions} value={byValueOptions?.find((f1) => f1.value === byValueSel)} onChange={onChangeByValueSel} />
                    </span>
                  )}
                </div>
              </div>
            }

            <div
              css={`
                display: flex;
                margin: 20px;
                top: ${115 - (forceOnlyOverall ? 50 : 0)}px;
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
                    <RefreshAndProgress
                      isMsgAnimRefresh={isRefreshing || isVersionTraining}
                      msgTop={isNotYetUse || isVersionTraining ? 25 : undefined}
                      msgMsg={isRefreshing || isVersionTraining ? 'Processing...' : isNotYetUse ? 'No Outliers' : undefined}
                      isDim={isNotYetUse || isRefreshing || isVersionTraining}
                    >
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
                                    {isByValue
                                      ? `${testPrediction} Rows with unseen for ${featureName} for value '${byValueSel}'`
                                      : isShowOverall || isOnlyOverall
                                      ? `Rows which are Outliers in the ${testPrediction} Data Using Isolation Forest`
                                      : isLowerUpper
                                      ? `${testPrediction} Rows which resulted in Value below 1%ile of distribution`
                                      : `${testPrediction} Rows with unseen values for ${featureName}`}
                                  </div>

                                  <div
                                    css={`
                                      height: ${hh2 - topHH}px;
                                      position: relative;
                                    `}
                                    onMouseLeave={onRowMouseLeave.bind(null, true)}
                                  >
                                    <MultiGrid
                                      ref={refGridB}
                                      cellRenderer={cellRenderer.bind(null, colDocStore2, colIMAGE, docStoreDef, colImageNameList, isShowOverall || isOnlyOverall, true, calcLowerCols(), calcLower(), featureName, byValueList)}
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
                                      columnCount={calcLowerCols()?.length ?? 0}
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
                                    {isLowerUpper ? `${testPrediction} Rows which resulted in Value above 99%ile of distribution` : `${testPrediction} Rows with rare values for ${featureName}`}
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
                                      cellRenderer={cellRenderer.bind(null, colDocStore2, colIMAGE, docStoreDef, colImageNameList, false, false, calcUpperCols(), calcUpper(), featureName, byValueList)}
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
                                      columnCount={calcUpperCols()?.length ?? 0}
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

export default MonitorOutliers;
