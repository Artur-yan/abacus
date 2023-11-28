import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import _ from 'lodash';
import * as React from 'react';
import Utils from '../../../../core/Utils';
import { useDataClusterType, useProjectId } from '../../../stores/hooks';
import HelpIcon from '../../HelpIcon/HelpIcon';
import Link from '../../Link/Link';
import MetricsFolderOne from '../../MetricsFolderOne/MetricsFolderOne';
import ModalConfirm from '../../ModalConfirm/ModalConfirm';
import ModelBlueprintModal from '../../ModelBlueprintModal/ModelBlueprintModal';
import PartsLink from '../../NavLeft/PartsLink';
import TableExt, { ITableExtColumn } from '../../TableExt/TableExt';
import TooltipExt from '../../TooltipExt/TooltipExt';
import AlgorithmActions from '../AlgorithmActions/AlgorithmActions';

const styles = require('./DetailsTables.module.css');
const stylesDark = require('../../antdUseDark.module.css');

const MAX_METRICS_ROW_PER_GRID = 16;
const FORECASTED_RATIO = 'forecastedRatio';
const EXCLUDED_COLUMNS = ['decileChartPerLabel', 'accuracyOverTime', 'limeFeatureImportance', 'ebmFeatureImportance', 'tsneChart', 'tsnePoints'];

// TODO(rohan): Theres's still code related to DetailsHeader in this file from when these were rendered in a common function, should be possible to remove it
const logsPopupContent = (infoLogs: string[]) => {
  const columns = [
    {
      title: 'Message',
      noAutoTooltip: true,
      render: (text, row) => {
        const enters = (message) => {
          if (_.isString(message) && message.indexOf('\n')) {
            return message.split('\n').map((str, ind) => <div key={`s${ind}`}>{str}</div>);
          }
          return message;
        };

        return (
          <div
            css={`
              padding: 8px 14px;
              font-size: 14px;
              font-weight: normal;
              white-space: normal;
            `}
          >
            <div
              css={`
                display: flex;
                margin-top: 8px;
              `}
            >
              <div>{enters(row.msg)}</div>
            </div>
          </div>
        );
      },
    },
  ] as ITableExtColumn[];

  let dataList = infoLogs?.map((s1) => ({ msg: s1 }));
  return (
    <div className={'useDark'}>
      <div
        css={`
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          text-align: center;
          padding: 8px;
        `}
      >
        Logs
      </div>
      <div
        css={`
          margin-top: 10px;
        `}
      >
        <TableExt autoHeight disableSort noHeader height={600} isVirtual columns={columns} dataSource={dataList ?? Utils.emptyStaticArray()} />
      </div>
    </div>
  );
};

const getSortFunction = (order) => (a1, b1) => {
  const a = a1?.value,
    b = b1?.value;
  if (a === b || a == null || b == null) {
    return 0;
  }
  if (a > b) {
    return order ? -1 : 1;
  }
  return order ? 1 : -1;
};

const Table = (props) => {
  let {
    detailedMetrics,
    m1use,
    isFirstTable,
    isFolderTable,
    backgroundColor,
    onlyContent,
    m1,
    metricsData,
    onClickChartFva,
    onHoverChartFva,
    onClickShowIds,
    onClickLeadModel,
    onClickExpandMoreRows,
    rowIndInt,
    m1otherMetrics,
    sortableColumns,
    showLeadModel,
    showLeadModelForDefaultOne,
    helpMakeDefaultUsed,
    detailModelId,
    columnsList,
    forecastedRatioMax,
    modelsExpanded,
    detailModelVersion,
    forceNoTree,
    renderTable,
    processNewDataAdditional,
    foldersCache,
    onFeatureAnalysis,
    isRegression,
  } = props;
  const projectId = useProjectId();
  const dataClusterType = useDataClusterType() || null;

  const [sortMetric, setSortMetric] = React.useState(null);
  const [sortMetricOrder, setSortMetricOrder] = React.useState(null);

  React.useMemo(() => {
    if (!sortableColumns.includes(sortMetric)) {
      return;
    }
    let sortedList = [];
    m1use[sortMetric]?.forEach?.((value, index) => sortedList.push({ value, index }));
    sortedList = sortedList.sort(getSortFunction(sortMetricOrder));
    columnsList.forEach((columnItem) => {
      const columnName = Object.keys(columnItem ?? {})[0];
      if (!columnName || !Array.isArray(m1use?.[columnName])) {
        return;
      }
      const res = [];
      sortedList.forEach((v1) => {
        res.push(m1use[columnName][v1.index]);
      });
      m1use[columnName] = res;
    });
  }, [sortMetric, sortMetricOrder, rowIndInt, sortableColumns, m1use]);

  let cols = [],
    colsNames = [],
    colsInd = 0;
  let formatValue = (v1, nameSmall, rowInd = 0, format1 = null, decimals = null, color = null) => {
    if (v1 == null || v1 === '') {
      return null;
    }

    let text = v1;
    let n1 = _.isNumber(v1) ? v1 : Utils.tryParseFloat(v1, null);
    if (n1 != null) {
      v1 = Utils.roundDefault(n1, decimals ?? 2);
    } else {
      v1 = text;
    }

    if (!Utils.isNullOrEmpty(format1) && v1 != null) {
      v1 = '' + (v1 ?? '') + format1;
    }

    if (color != null) {
      v1 = <span style={{ color: color }}>{v1}</span>;
    }

    if (m1.fvaData?.[nameSmall] && rowInd === 0 && !_.isArray(v1)) {
      v1 = (
        <span key={'small_fva_' + nameSmall}>
          {v1}
          {isFirstTable && (
            <FontAwesomeIcon
              className={styles.icon}
              onClick={metricsData?.length > 1 ? () => onClickChartFva(m1, nameSmall) : null}
              onMouseEnter={(e) => onHoverChartFva(nameSmall, true, e)}
              onMouseLeave={(e) => onHoverChartFva(nameSmall, false, e)}
              icon={['far', 'chart-scatter']}
              transform={{ size: 18, x: 0, y: 0 }}
              style={{ cursor: 'pointer', marginLeft: '9px' }}
            />
          )}
        </span>
      );
    }
    return v1;
  };

  let addColValue = (nameSmall, colName, v1, width = null, rowInd = 0, format1 = null, decimals1 = null, showIds1 = null, showIdsButtonTitle1 = null, filterIdsName = null, inRed = false) => {
    v1 = formatValue(v1, nameSmall, rowInd, format1, decimals1, inRed ? '#f00' : null);
    if (_.isNumber(v1) || _.isString(v1)) {
      v1 = <span style={{ padding: 4 }}>{v1}</span>;
    }

    if (!colName) {
      colName = <span>&nbsp;</span>;
    }
    let helpId = nameSmall,
      helpIcon = null;
    if (helpId) {
      helpIcon = <HelpIcon key={'help' + helpId + '_' + colsInd} id={helpId} style={{ marginLeft: '4px' }} />;
    }

    let col1 = (
      <div key={'head_ch_' + colsInd} style={{ height: '100%', padding: '4px 8px' }}>
        {colName}
        {helpIcon}
      </div>
    );
    let idsButton = null;
    if (!Utils.isNullOrEmpty(showIdsButtonTitle1) && showIds1 != null && _.isArray(showIds1) && showIds1.length > 0) {
      idsButton = (
        <Button
          css={`
            margin-left: 6px;
            font-size: 12px;
          `}
          size="small"
          type="primary"
          ghost
          onClick={() => onClickShowIds(showIds1, nameSmall, m1?.modelVersion, filterIdsName, colName)}
        >
          {showIdsButtonTitle1}
        </Button>
      );
    }

    if (!Array.isArray(v1)) {
      v1 = [v1];
    }
    const v3 = v1.map((v, ind) => (
      <div key={`row2${ind}_${colsInd}_${rowInd}`} style={{ width: width == null ? '' : width }}>
        {v}
        {Utils.isNullOrEmpty(v) ? null : idsButton}
      </div>
    ));

    v1 = col1 == null ? v3 : [col1].concat(v3);
    cols.push(v1);
    colsNames.push(nameSmall);
    colsInd++;
  };

  const algorithmNames = m1.otherMetrics?.map((obj) => Object.keys(obj || {})[0]);
  if (algorithmNames != null) {
    let algorithmName = '';
    if (_.isArray(algorithmNames)) {
      algorithmName = algorithmNames[rowIndInt];
    }
    let isDeployable = false,
      algorithm = null,
      legacyModelVersion = null,
      infoLogs = null,
      onIsExportable = false,
      isAutoselectable = false;
    if (m1otherMetrics != null) {
      let omValue = Object.values(m1otherMetrics)?.[0] as any;
      isDeployable = omValue?.deployable === true;
      onIsExportable = omValue?.isExportable === true;
      isAutoselectable = omValue?.isAutoselectable;
      legacyModelVersion = omValue?.modelVersion;
      if (Utils.isNullOrEmpty(algorithm)) {
        algorithm = omValue?.algorithm;
      }
      infoLogs = omValue?.infoLogs;
    }
    const isDefaultAlgorithm = m1?.defaultAlgorithm == algorithm;

    addColValue(
      '',
      '',
      <div className={styles.algoFirstCell}>
        {!isFolderTable && !Utils.isNullOrEmpty(algorithm) && (
          <>
            <div>
              {algorithmName}
              <HelpIcon id={`metrics_algo_${algorithmName}`} style={{ marginLeft: 4 }} />
            </div>
            {showLeadModel && !isDefaultAlgorithm && !isDeployable && (
              <div
                css={`
                  margin-top: 10px;
                `}
              >
                <span>Not Deployable</span>
                <HelpIcon id={'not_deployable'} style={{ marginLeft: 4 }} />
              </div>
            )}
            {showLeadModel && !isDefaultAlgorithm && !isAutoselectable && (
              <div
                css={`
                  margin-top: 10px;
                `}
              >
                <span>Not Auto Selectable</span>
                <HelpIcon id={'not_auto_selectable'} style={{ marginLeft: 4 }} />
              </div>
            )}
            {showLeadModel && !isDefaultAlgorithm && isDeployable && (
              <div
                css={`
                  margin-top: 10px;
                `}
              >
                <TooltipExt title={`The default model will be deployed`}>
                  <Button
                    css={`
                      font-size: 12px;
                    `}
                    ghost
                    size={'small'}
                    type={'default'}
                    onClick={() => onClickLeadModel(detailModelId, algorithm, dataClusterType)}
                  >
                    Make Default Model
                  </Button>
                </TooltipExt>
                {!helpMakeDefaultUsed && <HelpIcon id={'metics_make_default_model_button'} style={{ marginLeft: 4 }} />}
              </div>
            )}
            {(showLeadModel || showLeadModelForDefaultOne) && isDefaultAlgorithm && (
              <div
                css={`
                  margin-top: 10px;
                `}
              >
                <span>
                  Default Model
                  <HelpIcon id={'metics_default_model'} style={{ marginLeft: 4 }} />
                </span>
              </div>
            )}
            <div
              css={`
                margin-top: 12px;
                font-size: 13px;
              `}
            >
              {[
                showLeadModel && isDeployable && rowIndInt && (
                  <span css={``} className={stylesDark.linkBlue}>
                    <Link newWindow to={['/' + PartsLink.model_metrics + '/' + projectId, 'detailModelId=' + Utils.encodeQueryParam(detailModelId) + '&algorithm=' + Utils.encodeQueryParam(legacyModelVersion)]}>
                      <span>charts</span>
                    </Link>
                  </span>
                ),
                infoLogs != null && infoLogs?.length > 0 && (
                  <span css={``} className={stylesDark.linkBlue}>
                    <ModalConfirm width={800} title={logsPopupContent(infoLogs)} okText={'Close'} cancelText={null} okType={'primary'}>
                      <span>logs</span>
                    </ModalConfirm>
                  </span>
                ),
                onIsExportable && (
                  <span css={``} className={stylesDark.linkBlue}>
                    <Link to={`/api/v0/exportModelArtifacts?modelVersion=${encodeURIComponent(legacyModelVersion)}&algorithm=${encodeURIComponent(algorithm || '')}`} noApp newWindow>
                      <span>artifact</span>
                    </Link>
                  </span>
                ),
                onFeatureAnalysis && (
                  <span css={``} className={stylesDark.linkBlue} onClick={onFeatureAnalysis}>
                    feature analysis
                  </span>
                ),
                legacyModelVersion && isRegression && <ModelBlueprintModal modelVersion={legacyModelVersion} algorithm={algorithm} algorithmName={algorithmName} />,
              ]
                .filter((s1) => !!s1)
                .map((s1, s1ind) => (
                  <span key={'s' + s1ind}>
                    {s1ind > 0 ? <span className={stylesDark.linkBlueColor}> | </span> : null}
                    {s1}
                  </span>
                ))}
            </div>
          </>
        )}
      </div>,
      '180px',
      rowIndInt,
    );

    if (!isFolderTable && showLeadModel && isDeployable && !Utils.isNullOrEmpty(algorithm) && m1?.defaultAlgorithm != algorithm) {
      helpMakeDefaultUsed = true;
    }
  }

  let classNameAlready = false;
  columnsList.forEach((c1) => {
    let kk = Object.keys(c1);
    if (kk && kk.length > 0 && kk[0]) {
      let nameSmall = kk[0];
      if (EXCLUDED_COLUMNS.includes(nameSmall) || m1.metricInfos?.[nameSmall]?.hideInGrid) {
        return;
      }

      let nameLong = c1[nameSmall];
      let showIds1 = m1.metricInfos?.[nameSmall]?.showIds;
      let filterIdsName = showIds1;
      if (!Utils.isNullOrEmpty(showIds1)) {
        let idsDict = detailedMetrics?.itemFilteringInfos;
        showIds1 = idsDict?.[showIds1 ?? '-'];
      } else {
        showIds1 = null;
      }

      const showIdsButtonTitle1 = m1.metricInfos?.[nameSmall]?.buttonTitle;
      const format1 = m1.metricInfos?.[nameSmall]?.format;
      const decimals1 = m1.metricInfos?.[nameSmall]?.decimals;

      if (!_.isString(nameSmall) || !_.isString(nameLong)) {
        return false;
      }

      if (nameSmall === 'className') {
        classNameAlready = true;
      }
      let v1: any = m1use?.['className'];
      let skipRows = [];
      if (classNameAlready && v1 != null && _.isArray(v1)) {
        v1 = v1[rowIndInt];
        if (!_.isArray(v1)) {
          v1 = [v1];
        }

        let p = v1.findIndex((v1) => v1?.toLowerCase() === 'macro avg');
        if (p > -1) {
          skipRows.push(p);
        }
        p = v1.findIndex((v1) => v1?.toLowerCase() === 'weighted avg');
        if (p > -1) {
          skipRows.push(p);
        }

        skipRows.sort().reverse();
      }
      v1 = m1use?.[nameSmall] || '';
      let inRed = false;
      let format2;
      if (_.isArray(v1)) {
        v1 = [...v1];
        skipRows?.some((ind) => {
          v1.splice(ind, 1);
        });

        let v2 = [];
        v1.some((v, vind) => {
          if (vind === 0) {
            if (nameSmall?.toLowerCase() === FORECASTED_RATIO) {
              if (_.isNumber(v) && v < forecastedRatioMax) {
                inRed = true;
              }
            }
          }
          v = formatValue(v, nameSmall, rowIndInt, format1, decimals1);
          if (v != null) {
            v2.push(
              <div key={'row_ch_' + vind + '_' + rowIndInt + nameSmall} style={{ padding: '4px 4px' }}>
                {v}
              </div>,
            );
          }
        });
        v1 = v2;
      } else {
        format2 = format1;
      }
      addColValue(nameSmall, nameLong, v1, undefined, rowIndInt, format2, decimals1, showIds1, showIdsButtonTitle1, filterIdsName, inRed);
    }
  });

  let max = 0;
  cols?.forEach((c1, c1ind) => {
    let c3 = m1?.metricInfos?.[colsNames?.[c1ind]];
    if (c3?.hideTable) {
      return;
    }
    max = Math.max(max, c1.length);
  });
  const m1Key = `${m1.modelId}_${m1.modelVersion}_${rowIndInt}`;
  let showExpand = false;
  if (max > MAX_METRICS_ROW_PER_GRID) {
    if (!modelsExpanded[m1Key]) {
      max = MAX_METRICS_ROW_PER_GRID;
      showExpand = true;
    }
  }

  let calcSortElem = (index) => {
    let c1 = colsNames?.[index];
    let c2 = cols?.[index];

    if (sortableColumns?.includes(c1)) {
      let iconElem = (
        <span className={'arrowSort'}>
          <FontAwesomeIcon
            icon={sortMetricOrder && sortMetric === c1 ? require('@fortawesome/pro-regular-svg-icons/faLongArrowUp').faLongArrowUp : require('@fortawesome/pro-regular-svg-icons/faLongArrowDown').faLongArrowDown}
            transform={{ size: 18, x: 0, y: 0 }}
            css={`
              color: white;
            `}
          />
        </span>
      );

      let onClickSort = () => {
        let newSortMetricOrder = false;
        if (c1 === sortMetric) {
          newSortMetricOrder = !sortMetricOrder;
        }
        setSortMetric(c1);
        setSortMetricOrder(newSortMetricOrder);
      };

      let c3 = m1?.metricInfos?.[c1];
      return (
        <div
          onClick={onClickSort}
          css={`
            display: flex;
            align-items: center;
            cursor: pointer;
            ${c3?.noWrap === true ? 'white-space: nowrap;' : c3?.noWrap === 'words' ? 'white-space: normal;' : ''}
            .arrowSort {
              opacity: ${sortMetric !== c1 ? 0 : 0.8};
            }
          `}
        >
          <span css={``}>{c2?.[0]}</span>
          {iconElem}
        </div>
      );
    } else {
      return c2?.[0];
    }
  };

  let body1 = (
    <>
      {new Array(max).fill(null).map((c1, c1ind) => {
        let isGreen = false;
        if (!isFolderTable && m1use != null) {
          isGreen = m1use?.isBestAlgorithm;
          if (!(m1?.pendingAlgorithms == null || m1?.pendingAlgorithms?.length === 0)) {
            isGreen = false;
          }
        }

        return (
          <tr key={`tr_${m1Key}_${c1ind}`} className={styles.algoHeader} css={!isFolderTable ? `background: ${isGreen ? '#1b640e74' : `${backgroundColor}`}` : `background: ${backgroundColor}; ${isFolderTable ? ' font-size: 13px;' : ''}`}>
            {cols?.map((c2, c2ind) => {
              // 0th row is compleletely ignored, don't understand what's happening here
              if (!c1ind) {
                return null;
              }
              let value1 = c2[c1ind];
              let c3 = m1?.metricInfos?.[colsNames?.[c2ind]];
              if (c3?.hideTable) {
                return;
              }

              let noWrap1 = c3?.noWrap === true ? 'nowrap' : c3?.noWrap === 'words' ? 'normal' : null;

              // table cell with algo name (first row, 0th column) requires more space,
              // so make its rowSpan = 3 or max rows (-1 for child table which are rendered inside a tr), which ever is less
              let algorithmRowSpan = Math.min(3, max - 1);
              // min row span should be 1
              algorithmRowSpan = Math.max(algorithmRowSpan, 1);
              // try to remove second and third row's 0th column so the algo cell can occupy that space
              if ((c1ind === 2 || c1ind === 3) && !c2ind) return null;
              return (
                <td key={`td_${c2ind}_${c1ind}`} rowSpan={c1ind === 1 && !c2ind ? algorithmRowSpan : 1} className={styles.algoCell} style={{ whiteSpace: noWrap1 as any }}>
                  {value1}
                </td>
              );
            })}
          </tr>
        );
      })}

      {showExpand && (
        <tr key={`tr_expnad_${m1Key}`}>
          <td colSpan={cols?.length || 1}>
            <span className={stylesDark.styleTextBlueBright} style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => onClickExpandMoreRows(m1Key)}>
              Expand more rows
            </span>
          </td>
        </tr>
      )}
    </>
  );

  if (onlyContent) {
    return body1;
  }

  let foldersTree = null;
  if (detailModelVersion) {
    let treeData = m1?.additionalExpandingMetricsTreesGlobalList;
    if (treeData != null && treeData.length > 0 && !forceNoTree) {
      treeData?.forEach((data) => {
        foldersTree ??= [];
        let algoName1 = m1use?.algoName;
        if (!Utils.isNullOrEmpty(algoName1)) {
          foldersTree.push(
            <MetricsFolderOne
              key={`folder_${foldersTree.length}`}
              data={data}
              renderTable={renderTable}
              isFirstTable={!rowIndInt}
              m1={m1use}
              processNewDataAdditional={processNewDataAdditional}
              foldersCache={foldersCache}
              modelVersion={m1.modelVersion}
              dataClusterType={dataClusterType}
              algoName={algoName1}
            />,
          );
        }
      });
    }
  }

  return (
    <table className={styles.tableDetail}>
      <thead>
        <tr>
          {cols?.map((c1, c1ind) => {
            let c3 = m1?.metricInfos?.[colsNames?.[c1ind]];
            if (c3?.hideTable) {
              return;
            }
            return (
              <td
                css={`
                  &:hover .arrowSort {
                    opacity: 1 !important;
                  }
                `}
                key={'td_head_' + c1ind}
                className={styles.header}
              >
                {calcSortElem(c1ind)}
              </td>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {body1}
        {foldersTree}
      </tbody>
    </table>
  );
};

const DetailsTables = (props) => {
  let {
    forceNoTree,
    foldersCache,
    metrics,
    metricsData,
    detailModelId,
    projectId,
    detailModelVersion,
    modelsExpanded,
    metricsAllVersions,
    showLeadModel,
    showLeadModelForDefaultOne,
    processNewDataAdditional,
    onClickChartFva,
    onHoverChartFva,
    onClickShowIds,
    onClickLeadModel,
    onClickExpandMoreRows,
    onFeatureAnalysis,
    updateSortPreference,
    recreateFolderCache,
    isRegression,
  } = props;

  let versionsList = null;
  if (detailModelId && metricsAllVersions) {
    versionsList = metricsAllVersions
      .filter((m1) => m1.modelId === detailModelId && m1.trainingCompletedAt)
      .map((m1) => ({
        modelVersion: m1.modelVersion,
        trainingCompletedAt: m1.trainingCompletedAt,
        overallInfoLogs: m1.overallInfoLogs,
      }));

    if (!versionsList?.length || metrics?.[0]?.algoName == null) {
      metrics = null;
    }
  }

  if (detailModelVersion && metrics) {
    metrics = metrics.filter((metric) => [metric.modelVersion, metric.predictionMetricVersion, metric.modelMonitorVersion].includes(detailModelVersion));
  }

  let res = metrics?.map((m1, m1ind) => {
    let rows = [];
    let columnsList = m1.metricNames;

    if (m1?.detailedMetrics?.hideSmape && columnsList) {
      columnsList = [...columnsList];
      let ind1 = columnsList.findIndex((m1) => m1?.smape != null || m1?.cSmape != null);
      if (ind1 > -1) {
        columnsList.splice(ind1, 1);
      }
    }

    if (!_.isArray(columnsList)) {
      return;
    }

    let forecastedRatioMax = null;
    let rowsCount = 1;
    columnsList.forEach((c1) => {
      let kk = Object.keys(c1);
      if (kk && kk.length > 0 && kk[0]) {
        let nameSmall = kk[0];
        let nameLong = c1[nameSmall];

        if (!_.isString(nameSmall) || !_.isString(nameLong)) {
          return false;
        }

        let v1: any = m1.metrics?.[nameSmall] || '';

        if (nameSmall?.toLowerCase() === FORECASTED_RATIO) {
          let vm = v1;
          if (_.isArray(vm)) {
            vm = vm?.[0];
          }
          if (_.isNumber(vm)) {
            if (forecastedRatioMax === null) {
              forecastedRatioMax = vm;
            }
            forecastedRatioMax = Math.max(forecastedRatioMax, vm);
          }
        }

        if (_.isArray(v1)) {
          let len = v1.length;
          rowsCount = Math.max(rowsCount, len);
        }
      }
    });

    const getSortableColumns = () => {
      let res = [];
      if (!m1?.otherMetrics?.length) {
        return res;
      }
      const metricColumns = Object.values(m1?.otherMetrics?.[0] || {})[0];
      Object.entries(metricColumns).forEach(([columnName, columnDataAllMetrics]) => {
        if (!Array.isArray(columnDataAllMetrics) || columnDataAllMetrics.length < 2) {
          return;
        }
        res.push(columnName);
      });
      return res;
    };

    const sortableColumns = getSortableColumns();

    let helpMakeDefaultUsed = false;
    m1.otherMetrics?.forEach?.((otherMetric, rowIndInt) => {
      let omValue = Object.values(otherMetric || {})?.[0] as any;

      const renderTable = (detailedMetrics, m1use, isFirstTable, backgroundColor, onlyContent, isFolderTable) => (
        // TODO(rohan): It should be possible to clean this up and not pass so many props
        <Table
          detailedMetrics={detailedMetrics}
          m1use={m1use}
          isFirstTable={isFirstTable}
          isFolderTable={isFolderTable}
          backgroundColor={backgroundColor}
          onlyContent={onlyContent}
          m1={m1}
          metricsData={metricsData}
          onClickChartFva={onClickChartFva}
          onHoverChartFva={onHoverChartFva}
          onClickShowIds={onClickShowIds}
          onClickLeadModel={onClickLeadModel}
          onClickExpandMoreRows={onClickExpandMoreRows}
          rowIndInt={rowIndInt}
          m1otherMetrics={otherMetric}
          sortableColumns={sortableColumns}
          showLeadModel={showLeadModel}
          showLeadModelForDefaultOne={showLeadModelForDefaultOne}
          helpMakeDefaultUsed={helpMakeDefaultUsed}
          detailModelId={detailModelId}
          columnsList={columnsList}
          forecastedRatioMax={forecastedRatioMax}
          modelsExpanded={modelsExpanded}
          detailModelVersion={detailModelVersion}
          forceNoTree={forceNoTree}
          renderTable={renderTable}
          processNewDataAdditional={processNewDataAdditional}
          foldersCache={foldersCache}
          onFeatureAnalysis={onFeatureAnalysis}
          isRegression={isRegression}
        />
      );

      rows.push(
        <div key={`row_ch_${rowIndInt}`} style={{ display: 'grid', marginBottom: 10 }}>
          {renderTable(m1?.detailedMetrics, omValue, !rowIndInt, '#19232f', false, false)}
        </div>,
      );
    });

    return (
      <div key={`tableContainer${m1ind}`}>
        <div key={`table_${m1ind}`} className={styles.table} style={{ display: 'flex', marginBottom: 26, borderRadius: 4 }}>
          <div style={{ display: 'flex', flexFlow: 'column', flex: 1, textAlign: 'center' }}>{rows}</div>
        </div>
      </div>
    );
  });

  return res?.length ? (
    <div>
      <AlgorithmActions updateSortPreference={updateSortPreference} metrics={metrics} detailModelVersion={detailModelVersion} recreateFolderCache={recreateFolderCache} projectId={projectId} />
      {res}
    </div>
  ) : null;
};

export default React.memo(DetailsTables);
