import { DatePicker } from 'antd';
import $ from 'jquery';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import { useBatchPred } from '../../api/REUses';
import batchPred, { BatchPredLifecycle } from '../../stores/reducers/batchPred';
import DataIntegrityOne from '../DataIntegrityOne/DataIntegrityOne';
import DateOld from '../DateOld/DateOld';
import HelpBox from '../HelpBox/HelpBox';
import Link from '../Link/Link';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./MonitoringDataIntegrityOne.module.css');
const sd = require('../antdUseDark.module.css');

interface IMonitoringDataIntegrityOneProps {
  isBP?: boolean;
}

const StyleLabel = styled.div`
  font-family: Matter;
  font-size: 15px;
  font-weight: 600;
  color: #f1f1f1;
`;

const MonitoringDataIntegrityOne = React.memo((props: PropsWithChildren<IMonitoringDataIntegrityOneProps>) => {
  const { batchPredParam, deploymentsParam, paramsProp, monitoringParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    monitoringParam: state.monitoring,
    deploymentsParam: state.deployments,
    batchPredParam: state.batchPred,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [featuresList, setFeaturesList] = useState([]);

  const [isNotYet, setIsNotYet] = useState(false);
  const [summary, setSummary] = useState(
    null as {
      targetColumn?: string;
      predictionDrift?: number;
      featureIndex: { distance; name: string; noOutliers }[];
      nullViolations: { name: string; predictionNullFreq; trainingNullFreq; violation: string }[];
      rangeViolations: { name: string; freqAboveTrainingRange; freqBelowTrainingRange; predictionMax; predictionMin; trainingMax; trainingMin }[];
      typeViolations: { name: string; predictionDataType: string; trainingDataType: string }[];
      catViolations?: { freqOutsideTrainingRange: number; mostCommonValues: any[]; name }[];
    },
  );

  const [featureSel, setFeatureSel] = useState(null);
  const [isRefreshingData, setIsRefreshingData] = useState(false);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }
  const deployId = paramsProp?.get('deployId');

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

  const batchPredOne = useBatchPred(useBatchPredId);

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

  useEffect(() => {
    if (!useBatchPredVersion || !props.isBP) {
      return;
    }

    setIsRefreshingData(true);
    REClient_.client_()._getFeatureDriftBatchPredictionSummary(useBatchPredVersion, (err, res) => {
      setIsRefreshingData(false);

      if (err || !res?.success) {
        //
      } else {
        let features = res?.result?.featureIndex ?? res?.result?.features ?? [];
        setFeaturesList(features);
        let f1 = features?.[0];
        if (f1 != null && _.isObject(f1)) {
          f1 = (f1 as any).name;
        }
        setFeatureSel(f1);

        setSummary(res?.result);
      }
    });
  }, [useBatchPredVersion, props.isBP]);

  const onChangeRangeDates = (values) => {
    let range1 = values?.[0]?.unix();
    let range2 = values?.[1]?.unix();

    if (range1 != null && range2 != null) {
      Location.push('/' + paramsProp?.get('mode') + '/' + paramsProp?.get('projectId') + '/' + paramsProp?.get('deployId'), undefined, 'rangeFrom=' + (range1 ?? '') + '&rangeTo=' + (range2 ?? ''));
    }

    setRangeDates(values);
  };

  const [rangeDates, setRangeDates] = useState(() => {
    let res = [moment().startOf('day').add(-6, 'days'), moment().startOf('day').add(1, 'days')];

    let dt1 = Utils.tryParseInt(paramsProp?.get('rangeFrom'));
    let dt2 = Utils.tryParseInt(paramsProp?.get('rangeTo'));
    if (dt1 != null && dt2 != null && _.isNumber(dt1) && _.isNumber(dt2)) {
      res = [moment.unix(dt1), moment.unix(dt2)];
    }

    return res;
  });

  useEffect(() => {
    if (!props.isBP && deployId) {
      setIsRefreshingData(true);
      REClient_.client_()._getFeatureDriftSummary(deployId, Utils.momentFormatForPython(rangeDates?.[0]), Utils.momentFormatForPython(rangeDates?.[1]), (err, res) => {
        setIsRefreshingData(false);

        if (err || !res?.success) {
          //
        } else {
          let features = res?.result?.featureIndex ?? res?.result?.features ?? [];
          setFeaturesList(features);
          let f1 = features?.[0]?.name;
          setFeatureSel(f1);

          setSummary(res?.result);
        }
      });
    }
  }, [props.isBP, rangeDates]);

  const onChangeBatchPred = (option1) => {
    Location.push('/' + paramsProp?.get('mode') + '/' + projectId + '/-', undefined, Utils.processParamsAsQuery({ useBatchPredId: option1?.value, useBatchPredVersion: '' }, window.location.search));
  };

  const onChangeBatchPredVersion = (option1) => {
    Location.push('/' + paramsProp?.get('mode') + '/' + projectId + '/-', undefined, Utils.processParamsAsQuery({ useBatchPredVersion: option1?.value }, window.location.search));
  };

  const onClickCatViolation = useCallback(
    (row, e) => {
      window.open('/app/' + PartsLink.monitoring_outliers + '/' + (projectId ?? '-') + '/' + deployId + '?useBatchPredVersion=' + useBatchPredVersion + '&findFeature=' + encodeURIComponent(row.name), '_blank');
    },
    [projectId, deployId, useBatchPredVersion],
  );

  const onClickCellTypeMismatch = useCallback(
    (row, key, e) => {
      const isTraining = $(e?.target).attr('data-training');
      let fgId = null;
      // console.warn(batchPredOne); //trainingFeatureGroupId and predictionFeatureGroupId
      if (isTraining === 'true') {
        fgId = batchPredOne?.trainingFeatureGroupId;
      } else if (isTraining === 'false') {
        fgId = batchPredOne?.predictionFeatureGroupId;
      }

      if (fgId != null || true) {
        REClient_.client_().describeBatchPredictionVersion(useBatchPredVersion, (err, res) => {
          let version1 = null;
          if (isTraining === 'true') {
            version1 = res?.result?.trainingFeatureGroupVersion;
          } else {
            version1 = res?.result?.predictionFeatureGroupVersion;
          }

          let versionPart = '';
          if (!Utils.isNullOrEmpty(version1)) {
            versionPart = '&featureGroupVersion=' + version1;
          }
          window.open('/app/' + PartsLink.feature_groups_data_explorer + '/' + projectId + '/' + fgId + '?findField=' + encodeURIComponent(row.name) + versionPart, '_blank');
        });
      }
    },
    [projectId, batchPredOne, useBatchPredVersion],
  );

  const rangesPickerDates = useMemo(() => {
    return {
      'Last Day': [moment().startOf('day').add(-1, 'days'), moment().startOf('day')],
      'Last Week': [moment().startOf('day').add(-7, 'days'), moment().startOf('day')],
      'Last Month': [moment().startOf('day').add(-1, 'month'), moment().startOf('day')],
    };
  }, []);

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
          <span>Data Integrity{props.isBP ? ' BP' : ''}</span>
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
          top: ${64}px;
          left: 0;
          right: 0;
          bottom: 0;
          margin: 20px;
        `}
      >
        <NanoScroller onlyVertical>
          <div>
            {!props.isBP && (
              <div
                css={`
                  color: white;
                  margin-top: 30px;
                `}
              >
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
                  <span css={``}>
                    <StyleLabel>Time Range:</StyleLabel>
                  </span>
                  <span
                    css={`
                      margin-left: 10px;
                    `}
                  >
                    <div
                      css={`
                        margin-left: 5px;
                        width: 200px;
                      `}
                    >
                      <DatePicker.RangePicker ranges={rangesPickerDates as any} allowClear={false} value={rangeDates as any} onChange={onChangeRangeDates} />
                    </div>
                  </span>
                </div>
              </div>
            )}

            {props.isBP && (
              <div
                css={`
                  color: white;
                  margin-bottom: 5px;
                  margin-top: 30px;
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
                  {props.isBP && useBatchPredId && (
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
                display: flex;
                margin: 20px 20px 20px 5px;
                top: 60px;
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
                    <RefreshAndProgress msgTop={isNotYet ? 25 : undefined} msgMsg={isRefreshingData ? 'Refreshing...' : isNotYet ? 'No Data Yet' : undefined} isDim={isRefreshingData || isNotYet} isMsgAnimRefresh={isRefreshingData}>
                      <DataIntegrityOne name={null} summary={summary} onClickCatViolation={onClickCatViolation} onClickCellTypeMismatch={onClickCellTypeMismatch} />
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

export default MonitoringDataIntegrityOne;
