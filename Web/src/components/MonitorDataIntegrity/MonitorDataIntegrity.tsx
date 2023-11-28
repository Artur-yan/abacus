import $ from 'jquery';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import monitoring, { ModelMonitoringLifecycle } from '../../stores/reducers/monitoring';
import DataIntegrityOne from '../DataIntegrityOne/DataIntegrityOne';
import HelpBox from '../HelpBox/HelpBox';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TimelineChart from '../TimelineChart/TimelineChart';
const s = require('./MonitorDataIntegrity.module.css');
const sd = require('../antdUseDark.module.css');

interface IMonitorDataIntegrityProps {}

const StyleLabel = styled.div`
  font-family: Matter;
  font-size: 15px;
  font-weight: 600;
  color: #f1f1f1;
`;

const MonitorDataIntegrity = React.memo((props: PropsWithChildren<IMonitorDataIntegrityProps>) => {
  const { paramsProp, authUser, monitoringParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    monitoringParam: state.monitoring,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [summary, setSummary] = useState(
    null as {
      targetColumn?: string;
      predictionDrift?: number;
      dataIntegrityTimeseries?: any;
      featureIndex: { distance; name: string; noOutliers }[];
      nullViolations: { name: string; predictionNullFreq; trainingNullFreq; violation: string }[];
      rangeViolations: { name: string; freqAboveTrainingRange; freqBelowTrainingRange; predictionMax; predictionMin; trainingMax; trainingMin }[];
      typeViolations: { name: string; predictionDataType: string; trainingDataType: string }[];
      catViolations?: { freqOutsideTrainingRange: number; mostCommonValues: any[]; name }[];
    },
  );
  const [isNotYet, setIsNotYet] = useState(false);

  const projectId = paramsProp?.get('projectId');
  const modelMonitorId = paramsProp?.get('modelMonitorId');
  const modelMonitorVersion = paramsProp?.get('useModelMonitorVersion');

  useEffect(() => {
    monitoring.memModelsById(true, modelMonitorId);
  }, [modelMonitorId, monitoringParam]);
  const monitorOne = useMemo(() => {
    return monitoring.memModelsById(false, modelMonitorId);
  }, [modelMonitorId, monitoringParam]);

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

  useEffect(() => {
    if (!modelMonitorVersion) {
      return;
    }

    REClient_.client_()._getFeatureDriftModelMonitorSummary(modelMonitorVersion, (err, res) => {
      if (err || !res?.success) {
        setSummary(null);
        setIsNotYet(true);
      } else {
        setSummary(res?.result ?? null);
        setIsNotYet(res?.result == null);
      }
    });
  }, [modelMonitorVersion, isVersionTraining]);

  const onClickCellTypeMismatch = useCallback(
    (row, key, e) => {
      const isTraining = $(e?.target).attr('data-training');
      let fgId = null;
      if (isTraining === 'true') {
        fgId = monitorOne?.trainingFeatureGroupId;
      } else if (isTraining === 'false') {
        fgId = monitorOne?.predictionFeatureGroupId;
      }

      if (fgId != null) {
        REClient_.client_().describeModelMonitorVersion(modelMonitorVersion, (err, res) => {
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
    [monitorOne, projectId, modelMonitorVersion],
  );

  const onClickCatViolation = useCallback(
    (row, e) => {
      window.open('/app/' + PartsLink.monitor_outliers + '/' + modelMonitorId + '/' + projectId + '?useModelMonitorVersion=' + modelMonitorVersion + '&findFeature=' + encodeURIComponent(row.name), '_blank');
    },
    [projectId, modelMonitorId, modelMonitorVersion],
  );

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
          <span>Data Integrity</span>
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
          <div
            css={`
              display: flex;
            `}
          >
            <div
              css={`
                flex: 1;
              `}
            >
              <div
                css={`
                  margin: 20px;
                `}
              >
                <div style={{ whiteSpace: 'nowrap', fontSize: '16px', marginBottom: '15px', display: 'flex' }}>
                  <div
                    css={`
                      font-family: Matter;
                      width: 100%;
                      font-size: 18px;
                      font-weight: 500;
                      line-height: 1.78;
                      margin-left: 20px;
                      margin-top: 30px;
                      display: flex;
                      align-items: center;
                    `}
                  >
                    <span>Model Accuracy</span>
                    <div
                      css={`
                        align-items: center;
                        display: flex;
                        margin-left: auto;
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
                            width: 340px;
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
                            width: 200px;
                            display: inline-block;
                          `}
                        >
                          <SelectExt options={optionsVersions} value={optionsVersions?.find((v1) => v1.value === modelMonitorVersion)} onChange={onChangeVersion} />
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                {summary?.dataIntegrityTimeseries && (
                  <div
                    css={`
                      margin-top: 30px;
                    `}
                  >
                    <TimelineChart timeSeries={summary?.dataIntegrityTimeseries} title="Violations" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            {<div></div>}

            <div
              css={`
                display: flex;
                margin: 20px;
              `}
            >
              <div
                css={`
                  flex: 1;
                  margin-right: 5px;
                `}
              >
                <div css={``}>
                  <div css={``}>
                    <RefreshAndProgress isRelative msgTop={isNotYet || isVersionTraining ? 25 : undefined} msgMsg={isNotYet || isVersionTraining ? 'No Data Integrity Yet' : undefined} isDim={isNotYet || isVersionTraining}>
                      <DataIntegrityOne
                        fgMonitorType={monitorOne?.monitorType === 'FEATURE_GROUP_MONITOR'}
                        name={monitorOne?.name}
                        summary={summary}
                        onClickCatViolation={onClickCatViolation}
                        onClickCellTypeMismatch={onClickCellTypeMismatch}
                      />
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

export default MonitorDataIntegrity;
