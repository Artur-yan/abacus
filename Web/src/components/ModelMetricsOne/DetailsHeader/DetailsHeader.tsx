import Button from 'antd/lib/button';
import _ from 'lodash';
import moment from 'moment';
import * as React from 'react';
import { Provider } from 'react-redux';
import Utils, { calcImgSrc } from '../../../../core/Utils';
import { useDataClusterType, useDetailModelId, useMode, useModelMonitorId, usePredictionMetricsId, usePredictionMetricVersion, useProjectId, useVersionExpanded } from '../../../stores/hooks';
import DateOld from '../../DateOld/DateOld';
import HelpIcon from '../../HelpIcon/HelpIcon';
import Link from '../../Link/Link';
import MetricsRectValue from '../../MetricsRectValue/MetricsRectValue';
import ModalConfirm from '../../ModalConfirm/ModalConfirm';
import SelectExt from '../../SelectExt/SelectExt';
import TextToSelectExt from '../../TextToSelectExt/TextToSelectExt';
import ViewLogs from '../../ViewLogs/ViewLogs';

const styles = require('./DetailsHeader.module.css');
const stylesDark = require('../../antdUseDark.module.css');

const MAX_METRICS_ROW_PER_GRID = 100;
const SWAP_BOXES_WIDTH = 1500;
const FORECASTED_RATIO = 'forecastedRatio';

// TODO(rohan): Theres's still code related to DetailsTables in this component from when these were rendered in a common function, should be possible to remove it
const DetailsHeader = (props) => {
  let { isMedium, isSmall, metrics, detailModelVersion, modelsExpanded, metricsAllVersions, onClickShowIds, onClickDetailsMetrics, fgTraining, fgPrediction } = props;

  const mode = useMode();
  const projectId = useProjectId();
  const versionExpanded = useVersionExpanded();
  const detailModelId = useDetailModelId();
  const dataClusterType = useDataClusterType() || null;
  const modelMonitorId = useModelMonitorId() || null;
  const predictionMetricsId = usePredictionMetricsId() || null;
  const predictionMetricVersion = usePredictionMetricVersion() || null;

  let versionsList = null;
  let overallInfoLogs = null;
  if (detailModelId && metricsAllVersions) {
    versionsList = metricsAllVersions
      .filter((m1) => m1.modelId === detailModelId && m1.trainingCompletedAt != null && m1.trainingCompletedAt !== 0)
      .map((m1) => ({
        modelVersion: m1.modelVersion,
        trainingCompletedAt: m1.trainingCompletedAt,
        overallInfoLogs: m1.overallInfoLogs,
      }));

    if (versionsList != null && versionsList?.length === 1) {
      overallInfoLogs = versionsList?.[0]?.overallInfoLogs;
    }

    if (!versionsList?.length) {
      metrics = null;
    }
  }

  if (detailModelVersion && metrics) {
    metrics = metrics.filter((metric) => [metric.modelVersion, metric.predictionMetricVersion, metric.modelMonitorVersion].includes(detailModelVersion));
  }

  let res = metrics?.map((m1, m1ind) => {
    let backColor = '#19232f';
    let rows = [];
    let columnsList = m1.metricNames;

    if (m1?.detailedMetrics?.hideSmape === true && columnsList) {
      columnsList = [...columnsList];
      let ind1 = columnsList.findIndex((m1) => m1?.smape != null);
      if (ind1 > -1) {
        columnsList.splice(ind1, 1);
      }

      ind1 = columnsList.findIndex((m1) => m1?.cSmape != null);
      if (ind1 > -1) {
        columnsList.splice(ind1, 1);
      }
    }

    if (columnsList && _.isArray(columnsList)) {
      let table1 = () => {
        let cols = [],
          colsNames = [],
          colsInd = 0;

        let formatValue = (v1, format1 = null, decimals = null, color = null) => {
          if (!v1) {
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
          return v1;
        };

        let addColValue = (nameSmall, colName, v1, width = null, rowInd = 0, format1 = null, decimals1 = null, showIds1 = null, showIdsButtonTitle1 = null, filterIdsName = null, inRed = false) => {
          v1 = formatValue(v1, format1, decimals1, inRed ? '#f00' : null);

          if (_.isNumber(v1) || _.isString(v1)) {
            v1 = <span style={{ padding: '4px 4px' }}>{v1}</span>;
          }

          if (!colName) {
            colName = <span>&nbsp;</span>;
          }
          let helpId = nameSmall,
            helpIcon = null;
          if (helpId) {
            helpIcon = <HelpIcon key={'help' + helpId + '_' + colsInd} id={helpId} style={{ marginLeft: '4px' }} />;
          }

          const nameSmallReal =
            m1.metricInfos?.[nameSmall]?.shortName ?? (nameSmall === 'numClusters' ? 'Clusters' : nameSmall === 'silhouetteScore' ? 'Silhouette Coefficient' : nameSmall === 'daviesBouldinScore' ? 'Davies Bouldin' : null);
          const col1 = (
            <span key={'head_chaa_' + colsInd}>
              {nameSmallReal || nameSmall}
              {helpIcon}
            </span>
          );

          let idsButton = null;
          if (!Utils.isNullOrEmpty(showIdsButtonTitle1) && showIds1 != null && _.isArray(showIds1) && showIds1.length > 0) {
            idsButton = (
              <Button
                onClick={() => onClickShowIds(showIds1, nameSmall, m1?.modelVersion, filterIdsName, colName)}
                css={`
                  margin-left: 6px;
                  font-size: 12px;
                `}
                size={'small'}
                type={'primary'}
                ghost
              >
                {showIdsButtonTitle1}
              </Button>
            );
          }

          if (_.isArray(v1)) {
            const v3 = v1.map((v, ind) => {
              return (
                <div key={'row2' + ind + '_' + colsInd + '_' + rowInd} style={{ width: width == null ? '' : width }}>
                  {v}
                  {Utils.isNullOrEmpty(v) ? null : idsButton}
                </div>
              );
            });
            v1 = col1 == null ? v3 : [col1].concat(v3);

            if (v1.length > 0) {
              v1 = v1.slice(0, 2);
            }
          } else {
            const v3 = [
              <div key={'row2' + colsInd + '_' + rowInd} style={{ width: width == null ? '' : width }}>
                {v1}
                {Utils.isNullOrEmpty(v1) ? null : idsButton}
              </div>,
            ];
            v1 = col1 == null ? v3 : [col1].concat(v3);
          }

          cols.push(v1);
          colsNames.push(nameSmall);

          colsInd++;
        };

        let classNameAlready = false;
        let featureCount = 0;
        columnsList.forEach((c1) => {
          let kk = Object.keys(c1);
          if (kk && kk.length > 0 && kk[0]) {
            let nameSmall = kk[0];

            const featured = (m1.featured != null && _.isArray(m1.featured) ? m1.featured : []).map((v1) => v1?.toLowerCase()).filter((v1) => v1 != null);
            if (!featured.includes(nameSmall?.toLowerCase()) && nameSmall !== 'numClusters' && nameSmall !== 'silhouetteScore' && nameSmall !== 'daviesBouldinScore') {
              return false;
            }
            featureCount++;
            if (isMedium && featureCount > 2 && nameSmall !== 'numClusters' && nameSmall !== 'silhouetteScore' && nameSmall !== 'daviesBouldinScore') {
              return false;
            }
            if (isSmall && featureCount > 1 && nameSmall !== 'numClusters' && nameSmall !== 'silhouetteScore' && nameSmall !== 'daviesBouldinScore') {
              return false;
            }
            let nameLong = c1[nameSmall];

            let showIds1 = m1.metricInfos?.[nameSmall]?.showIds;
            let filterIdsName = showIds1;
            if (!Utils.isNullOrEmpty(showIds1)) {
              let idsDict = m1?.detailedMetrics?.itemFilteringInfos;
              showIds1 = idsDict?.[showIds1 ?? '-'];
            } else {
              showIds1 = null;
            }

            const showIdsButtonTitle1 = m1.metricInfos?.[nameSmall]?.buttonTitle;
            const format1 = m1.metricInfos?.[nameSmall]?.format;
            const decimals1 = m1.metricInfos?.[nameSmall]?.decimals ?? (nameSmall === 'numClusters' ? 0 : null);

            if (!_.isString(nameSmall) || !_.isString(nameLong)) {
              return false;
            }

            if (nameSmall === 'className') {
              classNameAlready = true;
            }
            let v1: any = m1.metrics?.['className'];
            let skipRows = [];
            if (classNameAlready && v1 != null && _.isArray(v1)) {
              v1 = v1[0];

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

            // Hack to show auc score on model version page as well as all models page, m1?.metricsOri?.[nameSmall] is used to get
            // the score on a single metric version page while m1?.metrics?.[nameSmall]?.[0] gets it on the all metrics page
            v1 = m1?.metricsOri?.[nameSmall] || m1?.metrics?.[nameSmall]?.[0];
            if (v1 === undefined) {
              return false;
            }

            let inRed = false;
            addColValue(nameSmall, nameLong, v1, undefined, 0, format1, decimals1, showIds1, showIdsButtonTitle1, filterIdsName, inRed);
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
        const m1Key = m1.modelId + '_' + m1.modelVersion;
        let showExpand = false;
        if (max > MAX_METRICS_ROW_PER_GRID) {
          if (!modelsExpanded[m1Key]) {
            max = MAX_METRICS_ROW_PER_GRID;
            showExpand = true;
          }
        }

        return (
          <table className={styles.tableDetail}>
            <tbody>
              {new Array(1).fill(null).map((c1, c1ind) => {
                let isFirstWithClusterTypeText = true;
                return (
                  <tr key={`tr_${m1Key}_${c1ind}`}>
                    {cols?.map((c2, c2ind) => {
                      if (c1ind === 0) {
                        let dataClusterTypeText = null,
                          dataClusterTypeForceValue = null;
                        if (colsNames?.[c2ind]?.toLowerCase() === 'wCAccuracy'.toLowerCase()) {
                          let find1 = m1?.dataClusterTypes?.find((d1) => d1?.value == dataClusterType);
                          let findRect1 = find1?.overrideTopTextMetric?.find((d1) => d1?.metric?.toLowerCase() == (colsNames?.[c2ind] ?? 'a-a')?.toLowerCase());
                          if (findRect1 != null) {
                            dataClusterTypeText = findRect1?.bottomText;
                            dataClusterTypeForceValue = findRect1?.value;
                          } else {
                            dataClusterTypeText = find1?.topText ?? find1?.top_text;
                          }
                        }
                        if (!dataClusterTypeText) {
                          dataClusterTypeText = null;
                        }
                        if (dataClusterTypeText != null) {
                          dataClusterTypeText = `(${dataClusterTypeText})`;
                        }

                        let isFCTT = isFirstWithClusterTypeText;
                        isFirstWithClusterTypeText = false;

                        return (
                          <td key={'td_' + c2ind + '_' + c1ind}>
                            <MetricsRectValue
                              dataClusterTypeText={isFCTT ? dataClusterTypeText : undefined}
                              isSmall={cols?.length > 3}
                              value={dataClusterTypeForceValue ?? c2?.[1]}
                              title={c2?.[0]}
                              onClick={() => onClickDetailsMetrics(m1.modelId, m1.modelVersion)}
                            />
                          </td>
                        );
                      } else {
                        let value1 = c2[c1ind];
                        let c3 = m1?.metricInfos?.[colsNames?.[c2ind]];
                        if (c3?.hideTable) {
                          return;
                        }

                        let noWrap1 = c3?.noWrap === true ? 'nowrap' : c3?.noWrap === 'words' ? 'normal' : null;
                        return (
                          <td key={'td_' + c2ind + '_' + c1ind} style={{ padding: '2px', whiteSpace: noWrap1 as any }}>
                            {value1}
                          </td>
                        );
                      }
                    })}
                    {!showExpand && overallInfoLogs != null && overallInfoLogs?.length > 0 && (
                      <td key={'td_logs_' + c1ind} css={``}>
                        <ModalConfirm
                          width={900}
                          title={
                            <Provider store={Utils.globalStore()}>
                              <div className={'useDark'}>
                                <ViewLogs msgRaw dataLogs={overallInfoLogs} />
                              </div>
                            </Provider>
                          }
                          okText={'Close'}
                          cancelText={null}
                          okType={'primary'}
                        >
                          <Button
                            type={'primary'}
                            css={`
                              height: 59px;
                            `}
                          >
                            Overall
                            <br />
                            Info Logs
                          </Button>
                        </ModalConfirm>
                        <HelpIcon id={'overall_info_logs_metrics'} style={{ marginLeft: '4px' }} />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        );
      };

      rows.push(
        <div key={'row_ch_'} style={{ display: 'grid', padding: 7, marginBottom: '10px' }}>
          {table1()}
        </div>,
      );
    }
    let algoElem = null;
    let bestModelElem = null;
    let versionElem = null;
    const FeatureGroupNames = (
      <>
        {fgTraining?.name && (
          <div style={{ marginTop: 2 }}>
            <span
              css={`
                opacity: 0.9;
              `}
            >
              Feature Group Training Name:
            </span>
            <span
              css={`
                margin-left: 5px;
              `}
            >
              {fgTraining?.name}
            </span>
          </div>
        )}
        {fgPrediction?.name && (
          <div style={{ marginTop: 2 }}>
            <span
              css={`
                opacity: 0.9;
              `}
            >
              Feature Group Prediction Name:
            </span>
            <span
              css={`
                margin-left: 5px;
              `}
            >
              {fgPrediction?.name}
            </span>
          </div>
        )}
      </>
    );
    if (m1?.trainingCompletedAt) {
      const dt1 = moment(m1?.trainingCompletedAt);
      if (dt1.isValid()) {
        versionElem = <div style={{ marginTop: 2 }}>{<DateOld always date={dt1} />}</div>;
      }
    }
    algoElem = m1?.algoName ? (
      <div style={{ marginTop: 2 }}>
        <span
          css={`
            opacity: 0.9;
          `}
        >
          Model Metrics For:
        </span>
        <span
          css={`
            margin-left: 5px;
          `}
        >
          {m1?.algoName}
        </span>
      </div>
    ) : null;
    if (m1?.defaultAlgorithm || m1?.defaultAlgoName) {
      bestModelElem = (
        <div style={{ marginTop: 2 }}>
          <span
            css={`
              opacity: 0.9;
            `}
          >
            Default Model:
          </span>
          <span
            css={`
              margin-left: 5px;
            `}
          >
            {m1?.defaultAlgoName || m1?.defaultAlgorithm}
          </span>
        </div>
      );
    }

    let menuVersions;
    const vv = versionsList
      ?.map((v1) => {
        return {
          label: (
            <span
              css={`
                font-size: 13px;
              `}
            >
              <span style={{ opacity: 0.7 }}>Version:</span> {v1.modelVersion} <span style={{ opacity: 0.7 }}>- {moment(v1.trainingCompletedAt).format('LLL')}</span>
            </span>
          ),
          value: v1.modelVersion,
        };
      })
      .filter((v1) => v1 != null);

    if (vv && vv.length > 1) {
      menuVersions = <SelectExt value={vv?.find((v1) => v1.value === detailModelVersion)} options={vv} onChange={(e) => onClickDetailsMetrics(detailModelId, e.value)} menuPortalTarget={document.getElementById('body2')} />;
    }

    let modelId = m1.modelId;
    let modelVersion = m1.modelVersion;
    if (predictionMetricVersion) {
      modelVersion = predictionMetricVersion;
    }

    let link3 = [
      '/' + mode + (modelMonitorId ? '/' + modelMonitorId : '') + '/' + projectId + (predictionMetricsId ? '/' + predictionMetricsId : ''),
      'detailModelId=' +
        Utils.encodeQueryParam(modelMonitorId ?? predictionMetricsId ?? modelId) +
        '&detailModelVersion=' +
        Utils.encodeQueryParam(modelVersion) +
        (versionExpanded == null ? '' : '&versionExpanded=1') +
        (predictionMetricVersion != null ? '&predictionMetricVersion=' + encodeURIComponent(predictionMetricVersion) : ''),
    ];

    let schemaDataUseElem = null;
    let predDataUsage = m1?.dataUsageSchema;
    if (predDataUsage && predDataUsage?.length > 0) {
      schemaDataUseElem = (
        <div
          css={`
            font-family: Roboto;
            font-size: 14px;
            margin-bottom: 5px;
          `}
        >
          {predDataUsage.map((p1, p1ind) => {
            if (Utils.isNullOrEmpty(p1?.featureMapping)) {
              return null;
            }
            return (
              <span key={'k' + p1ind}>
                {p1ind > 0 ? <span>, </span> : null}
                <span>
                  {p1?.name}:&nbsp;
                  <span
                    css={`
                      opacity: 0.8;
                    `}
                  >
                    {p1?.featureMapping}
                  </span>
                </span>
              </span>
            );
          })}
        </div>
      );
    }

    return (
      <div key={'tableTop_' + m1ind}>
        <div key={'table_' + m1ind} className={styles.table} style={{ marginTop: 30, display: 'flex', padding: 20, marginBottom: '26px', borderRadius: '4px', backgroundColor: backColor }}>
          {
            <div style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', padding: '8px', textAlign: 'left' }}>
              <Link to={link3}>
                <div style={{ marginLeft: 16, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {
                    <div style={{ marginRight: '23px' }}>
                      <img src={calcImgSrc('/imgs/modelMetricIcon.png')} alt={''} style={{ width: '80px' }} />
                    </div>
                  }

                  <div style={{ flex: 1 }}>
                    {
                      <div
                        css={`
                          font-family: Matter;
                          font-size: 21px;
                          font-weight: 500;
                          line-height: 1.52;
                          min-width: 120px;
                        `}
                        className={stylesDark.linkGreen}
                      >
                        {m1.name}
                      </div>
                    }
                    {
                      <div
                        css={`
                          font-family: Matter;
                          font-size: 16px;
                          line-height: 2;
                          color: #d1e4f5;
                        `}
                      >
                        {Utils.isNullOrEmpty(versionExpanded) && <span>Version {m1.modelVersion ?? null}</span>}
                        {menuVersions != null && (
                          <TextToSelectExt expanded={!Utils.isNullOrEmpty(versionExpanded)}>
                            <span
                              css={`
                                margin: 4px 0;
                                width: 380px;
                                display: inline-block;
                                margin-left: ${versionExpanded ? 0 : 10}px;
                              `}
                            >
                              {menuVersions}
                            </span>
                          </TextToSelectExt>
                        )}
                      </div>
                    }
                    {!Utils.isNullOrEmpty(m1.targetColumn) && (
                      <div
                        css={`
                          font-family: Roboto;
                          display: flex;
                          align-items: center;
                          font-size: 14px;
                          margin-bottom: 5px;
                        `}
                      >
                        <span
                          css={`
                            opacity: 0.9;
                          `}
                        >
                          Target Column:
                        </span>
                        <span
                          css={`
                            margin-left: 5px;
                          `}
                        >
                          {m1.targetColumn}
                        </span>
                      </div>
                    )}
                    {schemaDataUseElem}
                    {versionElem}
                    {algoElem}
                    {bestModelElem}
                    {FeatureGroupNames}
                  </div>
                </div>
              </Link>
            </div>
          }
          <div style={{ display: 'flex', flexFlow: 'column', flex: 0, textAlign: 'center', whiteSpace: 'nowrap' }}>{rows}</div>

          {Utils.isNullOrEmpty(detailModelId) && (
            <div
              css={`
                text-align: center;
                @media only screen and (max-width: ${SWAP_BOXES_WIDTH}px) {
                  display: none !important;
                }
              `}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginLeft: '12px' }}
            >
              <Button type={'primary'} onClick={() => onClickDetailsMetrics(m1.modelId, m1.modelVersion)}>
                Show more details
              </Button>
            </div>
          )}
        </div>

        {Utils.isNullOrEmpty(detailModelId) && (
          <div
            css={`
              margin-top: -23px;
              padding: 6px 0;
              background: ${backColor};
              text-align: center;
              @media only screen and (min-width: ${SWAP_BOXES_WIDTH}px) {
                display: none !important;
              }
            `}
          >
            <Button type={'primary'} onClick={() => onClickDetailsMetrics(m1.modelId, m1.modelVersion)}>
              Show more details
            </Button>
          </div>
        )}
      </div>
    );
  });
  return <div>{res}</div>;
};

export default React.memo(DetailsHeader);
