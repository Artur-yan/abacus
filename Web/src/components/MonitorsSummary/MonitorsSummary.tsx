import LinearProgress from '@mui/material/LinearProgress';
import Tabs from 'antd/lib/tabs';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils, { ColorsGradients } from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import StoreActions from '../../stores/actions/StoreActions';
import { ModelMonitoringLifecycle } from '../../stores/reducers/monitoring';
import ChartXYExt from '../ChartXYExt/ChartXYExt';
import DateOld from '../DateOld/DateOld';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./MonitorsSummary.module.css');
const sd = require('../antdUseDark.module.css');
const { TabPane } = Tabs;

interface IMonitorsSummaryProps {}

const MonitorsSummary = React.memo((props: PropsWithChildren<IMonitorsSummaryProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [summary, setSummary] = useState(null as { totalStarredMonitors?: number; dataKeys?; labelKeys?: { keyName?; displayName? }[]; alerts?; dataIntegrity?; featureDrift?; labelDrift?; monitorData?: any[]; performance?; summary? });
  const [tabSel, setTabSel] = useState(null);

  const tabs = useMemo(() => {
    if (summary?.labelKeys == null || !_.isArray(summary?.labelKeys)) {
      return [];
    }

    let firstKey = summary?.labelKeys?.[0]?.keyName;
    if (firstKey) {
      setTabSel((s1) => {
        if (s1 == null) {
          s1 = firstKey;
        }
        return s1;
      });
    }

    return summary?.labelKeys?.map((k1) => ({ label: k1.displayName, value: k1.keyName }));
  }, [summary]);

  useEffect(() => {
    REClient_.client_().getModelMonitorSummaryFromOrganization(null, (err, res) => {
      // console.warn(res);
      setSummary(res?.result ?? {});
    });
  }, []);

  const onChangeTabActive = (key1) => {
    setTabSel(key1);
  };

  const monitorsListColumns = useMemo(() => {
    return [
      {
        title: 'Monitor Name',
        field: 'monitorName',
        isLinked: true,
        render: (text, row, index) => {
          return text == null ? (
            ''
          ) : (
            <Link forceSpanUse to={'/' + PartsLink.model_detail_monitor + '/' + row?.modelMonitorId + '/' + row?.projectId}>
              {text}
            </Link>
          );
        },
      },
      {
        title: 'Project Name',
        field: 'projectName',
        isLinked: true,
        render: (text, row, index) => {
          return text == null ? (
            ''
          ) : (
            <Link forceSpanUse to={'/' + PartsLink.project_dashboard + '/' + row?.projectId}>
              {text}
            </Link>
          );
        },
      },
      {
        title: 'Status',
        field: ['status'],
        render: (text, row, index) => {
          let status1 = row?.status;

          let isTraining = row.modelMonitorId && StoreActions.refreshMonitorUntilStateIsTraining_(row.modelMonitorId);

          if (!isTraining && [ModelMonitoringLifecycle.MONITORING, ModelMonitoringLifecycle.PENDING].includes(status1 || '')) {
            StoreActions.refreshDoMonitorAll_(row.modelMonitorId, row?.projectId);
            isTraining = true;
          }

          if (isTraining) {
            return (
              <span>
                <div style={{ whiteSpace: 'nowrap' }}>{'Processing'}...</div>
                <div style={{ marginTop: '5px' }}>
                  <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
                </div>
              </span>
            );
          } else {
            let res = <span style={{ whiteSpace: 'nowrap' }}>{Utils.upperFirst(status1)}</span>;
            if ([ModelMonitoringLifecycle.FAILED.toLowerCase()].includes((status1 || '').toLowerCase())) {
              res = <span className={sd.red}>{res}</span>;
            }
            return res;
          }
        },
        useSecondRowArrow: true,
        renderSecondRow: (text, row, index) => {
          let status1 = row?.status;

          let res = null;
          if ([ModelMonitoringLifecycle.FAILED.toLowerCase()].includes((status1 || '').toLowerCase())) {
            if (row.lifecycleMsg) {
              res = (
                <span>
                  <span
                    css={`
                      margin-right: 5px;
                    `}
                  >
                    Error:
                  </span>
                  <span
                    css={`
                      color: #bf2c2c;
                    `}
                  >
                    {row.lifecycleMsg}
                  </span>
                </span>
              );
            }
          }
          return res;
        },
      },
      {
        title: 'Model Drift',
        field: 'modelDrift',
        render: (text, row, index) => {
          return text == null ? '' : Utils.decimals(text, 3);
        },
        width: 110,
      },
      {
        title: '% Features Drifting',
        field: 'featureDrift',
        render: (text, row, index) => {
          return text == null ? '' : Utils.decimals(text, 3) + '%';
        },
        width: 110,
      },
      {
        title: 'Di Issues',
        field: 'diIssues',
      },
      {
        title: 'Accuracy',
        field: 'accuracy',
        render: (text, row, index) => {
          return text == null ? '' : Utils.decimals(text, 3) + '%';
        },
        width: 110,
      },
      {
        title: 'Alerts',
        field: 'alerts',
      },
      {
        title: 'Created By',
        field: 'createdBy',
      },
      {
        title: 'Created At',
        field: 'createdAt',
        render: (text, row, index) => {
          return text == null ? '-' : <DateOld always date={text} />;
        },
        width: 220,
      },
      {
        title: 'Updated At',
        field: 'updatedAt',
        render: (text, row, index) => {
          return text == null ? '-' : <DateOld always date={text} />;
        },
        width: 220,
      },
    ] as ITableExtColumn[];
  }, []);

  const monitorsList = useMemo(() => {
    return (summary?.monitorData?.[tabSel] ?? [])?.slice(0, 2000);
  }, [summary, tabSel]);

  const calcKey = useCallback((r1) => r1?.modelMonitorId + ' ' + r1?.modelMonitorInstanceId, []);

  const ww = 356 - 40; //244;

  const chartsList = useMemo(() => {
    const hh = 244;

    const calcChart = (data1, calcNum?, tooltipConvertValue?) => {
      let total = 0;
      data1?.some((d1) => {
        total += d1?.value ?? 0;
      });
      if (total === 0 || total == null) {
        total = null;
      } else if (calcNum != null) {
        total = calcNum(total);
      }
      return (
        <div
          css={`
            display: flex;
            justify-content: center;
          `}
        >
          <div
            css={`
              position: relative;
              margin: 0 10px;
            `}
          >
            <div
              css={`
                width: ${ww}px;
                height: ${hh - 2}px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: Matter;
                font-size: 48px;
                font-weight: 500;
                letter-spacing: -0.6px;
              `}
              className={sd.pointerEventsNone + ' ' + sd.absolute}
            >
              {total}
            </div>
            <div
              css={`
                display: flex;
                justify-content: center;
              `}
            >
              <ChartXYExt
                width={ww}
                height={hh}
                colorFixed={ColorsGradients}
                noGrid
                type={'pie'}
                useEC
                data={{
                  legendBottomSpace: 50,
                  pieNoLines: true,
                  gridContainLabel: true,
                  pieRadius: ['65%', '90%'],
                  pieSpace: false,
                  tooltipConvertValue: tooltipConvertValue,
                  useLegend: false,
                  useLegendBottom: true,
                  data: data1 ?? [],
                }}
              />
            </div>
          </div>
        </div>
      );
    };

    const calcChartBars = (dataList, titleX, titleY, color1, tooltipConvertValue?) => {
      let data1 = _.assign(
        {},
        {
          roundBars: true,
          barMaxWidth: 20,
          barWidth: '60%',
          // labelMaxChars: labelMaxChars,
          gridColor: '#4c5b92',
          labelColor: '#8798ad',
          titleStyle: {
            color: '#d1e4f5',
            fontFamily: 'Matter',
            fontSize: 13,
            fontWeight: 'bold',
          },
          fieldNameTooltip: tooltipConvertValue == null || !titleY ? undefined : [_.trim(titleY?.replace('%', '') || '')],
          tooltipConvertValue: tooltipConvertValue,
          data: dataList,
          useTitles: true,
          titleX,
          titleY,
        },
      );

      return (
        <div
          css={`
            display: flex;
            justify-content: center;
          `}
        >
          <div
            css={`
              display: flex;
              justify-content: center;
            `}
          >
            <ChartXYExt width={ww + 40} height={hh + 110} colorFixed={color1 as any} type={'bar'} useEC data={data1} />
          </div>
        </div>
      );
    };

    const calcTile = (key1) => summary?.dataKeys?.find((d1) => d1.keyName?.toUpperCase() === key1?.toUpperCase())?.displayName;

    let sum1 = summary?.summary?.[tabSel];
    return [
      {
        key: 'summary',
        title: calcTile('summary') || 'Summary',
        content: (
          <div
            css={`
              display: flex;
              gap: 24px;
              flex-wrap: wrap;
            `}
          >
            {[
              {
                title: 'Monitors',
                value: sum1?.numMonitors,
              },
              {
                title: 'Versions',
                value: sum1?.numVersions,
              },
              {
                title: 'Predictions',
                value: sum1?.numPredictions,
              },
              {
                title: 'Failures',
                value: sum1?.numFailures,
              },
            ].map((s1, s1ind) => {
              return (
                <div
                  key={'ss' + s1ind}
                  css={`
                    padding-top: 12px;
                    background-image: linear-gradient(to bottom, #a55cff, #6419ff);
                    width: 145px;
                    height: 130px;
                  `}
                >
                  <div
                    css={`
                      font-family: Matter;
                      font-size: 48px;
                      font-weight: 500;
                      text-align: center;
                    `}
                  >
                    {s1.value == null ? <span>&nbsp;</span> : null}
                    {s1.value != null && <TooltipExt title={'' + s1.value == Utils.prettyPrintNumber(s1.value, 0) ? null : '' + s1.value}>{Utils.prettyPrintNumber(s1.value, 0)}</TooltipExt>}
                  </div>
                  <div
                    css={`
                      font-family: Matter;
                      font-size: 16px;
                      font-weight: 600;
                      letter-spacing: 0.8px;
                      text-align: center;
                      color: #d1e4f5;
                      white-space: nowrap;
                    `}
                  >
                    {s1.title}
                  </div>
                </div>
              );
            })}
          </div>
        ),
      },
      {
        key: 'featureDrift',
        title: calcTile('featureDrift') || 'Feature Drift',
        content: calcChart(
          summary?.featureDrift?.dataKeys
            ?.map((d1) => {
              return {
                name: d1.displayName,
                value: summary?.featureDrift?.[tabSel]?.[d1.keyName] ?? null,
                // tooltip: `${d1.displayName}&nbsp;&nbsp;&nbsp;${Math.trunc(v1*100)+'%'}`,
              };
            })
            ?.filter((d1) => d1.value !== 0 && d1.value != null),
          (v1) => summary?.featureDrift?.[tabSel]?.percentDrift + '%',
        ),
      },
      {
        key: 'labelDrift',
        title: calcTile('labelDrift') || 'Model Drift',
        content: calcChartBars(
          summary?.labelDrift?.[tabSel]?.histogram ?? [],
          summary?.labelDrift?.histogramKeys?.find((h1) => h1?.keyName === 'x')?.displayName || '-',
          summary?.labelDrift?.histogramKeys?.find((h1) => h1?.keyName === 'y')?.displayName || '-',
          { from: '#06edbd', to: '#006870' },
          (v1) => (v1 == null ? null : '' + v1 + '%'),
        ),
      },
      {
        key: 'dataIntegrity',
        title: calcTile('dataIntegrity') || 'Data Integrity',
        content: calcChart(
          summary?.dataIntegrity?.dataKeys
            ?.map((d1) => ({
              name: d1.displayName,
              value: summary?.dataIntegrity?.[tabSel]?.[d1.keyName] ?? null,
            }))
            ?.filter((d1) => d1.value !== 0 && d1.value != null),
        ),
      },
      {
        key: 'performance',
        title: calcTile('performance') || 'Performance',
        content: calcChartBars(
          summary?.performance?.[tabSel]?.histogram ?? [],
          summary?.performance?.histogramKeys?.find((h1) => h1?.keyName === 'x')?.displayName || '-',
          summary?.performance?.histogramKeys?.find((h1) => h1?.keyName === 'y')?.displayName || '-',
          { from: '#c08dff', to: '#7432fb' },
          (v1) => (v1 == null ? null : '' + v1 + '%'),
        ),
      },
      {
        key: 'alerts',
        title: calcTile('alerts') || 'Alerts',
        content: calcChart(
          summary?.alerts?.dataKeys
            ?.map((d1) => ({
              name: d1.displayName,
              value: summary?.alerts?.[tabSel]?.[d1.keyName] ?? null,
            }))
            ?.filter((d1) => d1.value !== 0 && d1.value != null),
        ),
      },
    ] as { title?; data?; content?; key? }[];
  }, [summary, tabSel]);

  const isReady = useMemo(() => {
    return summary?.totalStarredMonitors != null && summary?.totalStarredMonitors > 0;
  }, [summary]);

  const tabsEmpty = tabs == null || tabs?.length === 0 || !isReady;

  return (
    <div className={sd.absolute + ' ' + sd.table} style={{ margin: '25px' }}>
      <NanoScroller onlyVertical>
        <div
          className={sd.titleTopHeaderAfter}
          style={{ height: topAfterHeaderHH }}
          css={`
            display: flex;
            align-items: center;
          `}
        >
          <span>
            {'Summary'}
            <HelpIcon id={'summary_org_title'} style={{ marginLeft: '4px' }} />
          </span>
          <span
            css={`
              flex: 1;
            `}
          ></span>
        </div>

        {!tabsEmpty && (
          <div style={{ margin: '10px 0' }}>
            <Tabs
              activeKey={tabSel}
              onChange={onChangeTabActive}
              css={`
                .ant-tabs-tab-btn {
                  outline: none !important;
                }
                .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
                  color: #38bfa1;
                }
                .ant-tabs-ink-bar {
                  background: #38bfa1;
                }
                .ant-tabs-tab:hover {
                  color: #38bfa1;
                }
              `}
            >
              {tabs?.map((t1) => {
                return (
                  <TabPane
                    forceRender={true}
                    tab={
                      <span
                        css={`
                          padding: 0 8px;
                        `}
                      >
                        {t1.label?.toUpperCase()}
                      </span>
                    }
                    key={t1.value}
                    style={{ position: 'relative', height: 0 + 'px' }}
                  ></TabPane>
                );
              })}
            </Tabs>
          </div>
        )}

        <div
          css={`
            margin: 10px 0;
            display: flex;
            gap: 21px;
            flex-wrap: wrap;
            max-width: ${(ww + 20 + 21) * 3 + 40}px;
          `}
        >
          {!tabsEmpty &&
            chartsList?.map((c1, c1ind) => {
              return (
                <div
                  key={'cha' + c1ind}
                  css={`
                    background-image: linear-gradient(to bottom, #253341, #19232f 104%);
                    padding: 18px;
                    width: 356px;
                    min-height: 464px;
                  `}
                >
                  <div
                    css={`
                      font-family: Matter;
                      font-size: 21px;
                      font-weight: 600;
                      text-align: center;
                      color: white;
                    `}
                  >
                    {c1?.title}
                    <HelpIcon id={`org_monitors_summary_rect_${c1?.key}`} style={{ marginLeft: '4px' }} />
                  </div>
                  <div
                    css={`
                      margin-top: 39px;
                      position: relative;
                    `}
                  >
                    {c1?.content}
                  </div>
                </div>
              );
            })}
        </div>

        {isReady && summary != null && (
          <div style={{ margin: '40px 0' }}>
            <div
              className={sd.titleTopHeaderAfter}
              style={{ marginBottom: '14px' }}
              css={`
                display: flex;
                align-items: center;
              `}
            >
              <span>Monitors</span>
              <HelpIcon id={'org_monitors_summary_title'} style={{ marginLeft: '4px' }} />
            </div>
            <TableExt
              noHover
              prefixHelpIdForColumnsAuto={'org_monitors_summary'}
              autoInfiniteScroll={50}
              isDetailTheme
              showEmptyIcon
              defaultSort={{ field: 'createdAt', isAsc: false }}
              dataSource={monitorsList}
              columns={monitorsListColumns}
              calcKey={calcKey}
            />
          </div>
        )}

        <div
          css={`
            height: 40px;
          `}
        >
          &nbsp;
        </div>

        {summary == null && <RefreshAndProgress isMsgAnimRefresh={true} msgMsg={'Loading...'}></RefreshAndProgress>}
        {!isReady && summary != null && (
          <RefreshAndProgress
            errorButtonText={'Go to Projects'}
            onClickErrorButton={(e) => {
              Location.push('/' + PartsLink.project_list + '/');
            }}
            errorMsg={`No monitors found. Create some monitors to include in the summary.`}
          ></RefreshAndProgress>
        )}
      </NanoScroller>
    </div>
  );
});

export default MonitorsSummary;
