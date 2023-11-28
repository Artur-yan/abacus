import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Checkbox from 'antd/lib/checkbox';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'style-loader?{"esModule": false}!css-loader!react-vertical-timeline-component/style.min.css';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import CopyText from '../CopyText/CopyText';
import { IconDeploys, IconModels, IconModelsMetrics } from '../NavLeft/utils';
const s = require('./MetricsHistory.module.css');
const sd = require('../antdUseDark.module.css');

interface IMetricsHistoryProps {
  projectId?: string;
}

const MetricsHistory = React.memo((props: PropsWithChildren<IMetricsHistoryProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const [usage, setUsage] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [datasetsVersions, setDatasetsVersions] = useState(null);
  const [models, setModels] = useState(null);
  const [deploys, setDeploys] = useState(null);
  const [metricsEnabled, setMetricsEnabled] = useState([]);

  const projectId = props.projectId ?? '1542a4a964';

  useEffect(() => {
    if (projectId) {
      REClient_.client_().get_models_by_project(projectId, (err, res) => {
        if (!err && res?.result) {
          let data = res.result;
          data = data.map((d1) => {
            d1.intIsModel = true;
            d1.intDate = d1.latestModelVersion?.trainingCompletedAt;
            if (d1.intDate != null) {
              d1.intDate = moment(d1.intDate);
            }
            return d1;
          });
          setModels(data);
        }
      });

      REClient_.client_().deployListForProject(projectId, (err, res) => {
        if (!err && res?.result) {
          let data = res.result;
          data = data.map((d1) => {
            d1.intIsDeploy = true;
            d1.intDate = d1.deployedAt;
            if (d1.intDate != null) {
              d1.intDate = moment(d1.intDate);
            }
            return d1;
          });

          setDeploys(data);
          // if(data?.[0].deploymentId!=null) {
          //   REClient_.client_().listDeployVersions(data?.[0].deploymentId, (err2, res2) => {
          //     console.log('res2', res2);
          //     setDeploys(data);
          //   });
          //
          // } else {
          //   setDeploys(data);
          // }
        }
      });

      REClient_.client_().listProjectDatasets(projectId, (err, res) => {
        if (!err && res?.result) {
          let data = res.result;

          if (data) {
            const ids = data.map((d1) => d1?.dataset?.datasetId).filter((v1) => !Utils.isNullOrEmpty(v1));
            let datas = Promise.all(
              ids.map((id1) => {
                const id2 = id1;
                return new Promise((resolve, reject) => {
                  REClient_.client_().listDatasetVersions(id2, null, null, (err, res) => {
                    if (!err && res?.result) {
                      let data = res.result;

                      data = data.map((d1) => {
                        d1.intIsDatasetVersion = true;
                        d1.intDate = d1.createdAt;
                        if (d1.intDate != null) {
                          d1.intDate = moment(d1.intDate);
                        }
                        return d1;
                      });
                      resolve(data);
                    } else {
                      resolve(null);
                    }
                  });
                });
              }),
            );

            datas.then((listData) => {
              setDatasetsVersions(listData == null ? null : _.flatten(listData));
            });
          }

          // setDatasetsVersions(data);
        }
      });

      REClient_.client_().get_metrics_data(projectId, (err, res) => {
        if (!err && res?.result) {
          let data = res.result;
          data = data.map((d1) => {
            d1.intIsMetrics = true;
            d1.intDate = d1.trainingCompletedAt;
            if (d1.intDate != null) {
              d1.intDate = moment(d1.intDate);
            }
            return d1;
          });

          setMetricsEnabled([...(data?.[0]?.featured || [])]);
          setMetrics(data);
        }
      });

      REClient_.client_()._getCurrentUsage(undefined, undefined, true, (err, res) => {
        if (!err && res?.result) {
          let data = res.result;

          let listRes = [];
          const doWorkList = (list, type1) => {
            if (list != null) {
              list.some((d1) => {
                if (d1.projectId === projectId) {
                  listRes.push({
                    price: (d1.price ?? 0) / 100,
                    name: d1.name,
                    date: d1.date,
                    type: type1,
                  });
                }
              });
            }
          };
          doWorkList(data?.training, 'Training');
          doWorkList(data?.deployments, 'Deployment');
          doWorkList(data?.batch, 'Batch');

          listRes = listRes.map((d1) => {
            d1.intIsUsage = true;
            d1.intDate = d1.date;
            if (d1.intDate != null) {
              d1.intDate = moment(d1.intDate);
            }
            return d1;
          });

          listRes = listRes.sort((a, b) => {
            if (a.intDate == null || b.intDate == null) {
              return 0;
            }
            return b.intDate.diff(a.intDate);
          });

          setUsage(listRes);
        }
      });
    }
  }, [projectId]);

  const list = useMemo(() => {
    if (metrics != null && deploys != null && models != null) {
      let res = []
        .concat(metrics ?? [])
        .concat(deploys ?? [])
        .concat(models ?? [])
        .concat(datasetsVersions ?? []);
      res = res.filter((v1) => v1.intDate != null);

      res = res.sort((a, b) => {
        if (a.intDate == null || b.intDate == null) {
          return 0;
        }
        return b.intDate.diff(a.intDate);
      });

      return res;
    }
  }, [metrics, metricsEnabled, deploys, models, datasetsVersions]);

  const renderMetrics = useMemo(() => {
    if (list) {
      return (
        <VerticalTimeline>
          {list.map((m1, m1ind) => {
            let m2 = null;
            if (m1.intIsMetrics || m1.intIsModel) {
              let ind = m1ind + 1;
              while (ind < list.length) {
                let mt = list[ind];
                if (mt.intIsModel && m1.intIsModel) {
                  m2 = mt;
                  break;
                }
                if (mt.intIsMetrics && m1.intIsMetrics) {
                  m2 = mt;
                  break;
                }
                ind++;
              }
            }

            let vv = [];
            let icon1 = null,
              name1 = null,
              id1 = null,
              nameM = null,
              iconImg = null;

            if (m1.intIsMetrics) {
              name1 = 'Metrics';
              iconImg = '/imgs/modelMetricIcon.png';

              icon1 = (
                <span>
                  <FontAwesomeIcon icon={IconModelsMetrics} transform={{ size: 22, x: 7.5, y: 8 }} style={{}} />
                </span>
              );
              metricsEnabled?.some((s1) => {
                let v1 = m1.metrics[s1];
                if (_.isArray(v1)) {
                  v1 = v1[0];
                }
                if (_.isNumber(v1)) {
                  v1 = Utils.decimals(v1, 3);
                } else if (_.isString(v1)) {
                  //
                } else {
                  v1 = null;
                }

                if (v1 != null) {
                  let v2 = null;
                  if (m2 != null) {
                    v2 = m2.metrics[s1];
                    if (_.isArray(v2)) {
                      v2 = v2[0];
                    }
                    if (_.isNumber(v2)) {
                      v2 = Utils.decimals(v2, 3);
                    } else if (_.isString(v2)) {
                      //
                    } else {
                      v2 = null;
                    }
                  }

                  let sDif = null;
                  if (_.isNumber(v1) && _.isNumber(v2)) {
                    sDif = Utils.decimals(v1 - v2, 3);
                  }
                  vv.push('' + s1 + ': ' + v1 + (sDif == null ? '' : ' (' + (sDif >= 0 ? '+' : '') + sDif + ')'));
                }
              });
            }
            if (m1.intIsModel) {
              name1 = 'Model';
              iconImg = '/imgs/modelIcon.png';
              nameM = m1.name;
              id1 = m1.modelId;
              icon1 = (
                <span>
                  <FontAwesomeIcon icon={IconModels} transform={{ size: 22, x: 7.5, y: 10 }} style={{}} />
                </span>
              );

              let stringify = (value) => {
                if (_.isArray(value) || _.isObject(value)) {
                  return JSON.stringify(value);
                } else {
                  return value;
                }
              };
              let paramsObj = m1.modelConfig;
              let paramsObj2 = m2?.modelConfig;
              if (paramsObj && !_.isEmpty(paramsObj)) {
                let kk = Object.keys(paramsObj).sort();
                const kkLen = kk.length;
                let kk2 = Object.keys(paramsObj2 ?? {});
                kk2.some((k2) => {
                  if (!kk.includes(k2)) {
                    kk.push(k2);
                  }
                });
                let paramsUsed = kk
                  .map((k1, k1ind) => {
                    if (k1ind > kkLen - 1) {
                      //kk2
                      const v2 = '' + k1 + ': ' + stringify(paramsObj2[k1]);
                      return v2;
                    }

                    const v1 = '' + k1 + ': ' + stringify(paramsObj[k1]);
                    if (paramsObj2 != null) {
                      const v2 = '' + k1 + ': ' + stringify(paramsObj2[k1]);
                      if (v1 === v2) {
                        return null;
                      }
                    }
                    return v1;
                  })
                  .filter((v1) => v1 != null)
                  .join(', ');
                vv.push('Config Changes: ' + paramsUsed);
              }
            }
            if (m1.intIsDeploy) {
              name1 = 'Deployment';
              iconImg = '/imgs/deployIcon.png';
              nameM = m1.name;
              id1 = m1.deploymentId;
              icon1 = (
                <span>
                  <FontAwesomeIcon icon={IconDeploys} transform={{ size: 22, x: 7.5, y: 9 }} style={{}} />
                </span>
              );

              vv.push('Status: ' + m1.status);
            }
            if (m1.intIsDatasetVersion) {
              name1 = 'Dataset';
              iconImg = '/imgs/datasetIcon.png';
              nameM = m1.name;
              id1 = m1.datasetId;

              vv.push('Version: ' + m1.datasetVersion);
              vv.push('Status: ' + m1.status);
            }

            let usageElem = null;
            if (usage != null) {
              let mSec = list[m1ind + 1];
              if (mSec != null) {
                let totals = {};
                usage.some((u1) => {
                  if (u1.price == null || u1.price === 0) {
                    return false;
                  }

                  if (u1.intDate.isSameOrBefore(m1.intDate) && u1.intDate.isAfter(mSec.intDate)) {
                    let t1 = totals[u1.type] ?? 0;
                    t1 += u1.price;
                    totals[u1.type] = t1;
                  }
                });

                if (!_.isEmpty(totals)) {
                  let kk = Object.keys(totals).sort();
                  usageElem = (
                    <div
                      css={`
                        position: absolute;
                        bottom: -48px;
                        left: 1px;
                      `}
                    >
                      <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faMoneyBill').faMoneyBill} transform={{ size: 17, x: 0, y: 0 }} style={{ marginRight: '5px' }} />
                      <b>Prices:&nbsp;</b>
                      {kk.map((k1) => {
                        return (
                          <span style={{ marginRight: '5px' }} key={'pr_' + k1}>
                            {k1 + ': $' + Utils.decimals(totals[k1], 2)}
                          </span>
                        );
                      })}
                    </div>
                  );
                }
              }
            }

            if (iconImg != null) {
              icon1 = <img src={calcImgSrc(iconImg)} alt={''} style={{ width: '40px', height: '40px', borderRadius: '50%', marginTop: '1.5px' }} />;
            }

            let mS = (
              <div
                css={`
                  position: relative;
                `}
              >
                {name1 != null && (
                  <div style={{ marginBottom: '6px' }} className={sd.styleTextGrayLight}>
                    <b>{name1}</b>
                    {id1 != null && (
                      <span style={{ marginLeft: '5px' }}>
                        &nbsp;-&nbsp;<CopyText>{'' + id1}</CopyText>
                      </span>
                    )}
                  </div>
                )}
                {nameM != null && (
                  <div style={{ marginBottom: '6px' }} className={sd.styleTextGrayLight}>
                    {nameM}
                  </div>
                )}
                {vv.map((v1, v1ind) => (
                  <div key={'m1_' + v1ind} style={{ margin: '3px 0' }}>
                    {v1}
                  </div>
                ))}

                {usageElem}
              </div>
            );

            return (
              <VerticalTimelineElement
                key={'vert' + m1ind}
                className="vertical-timeline-element--work"
                contentStyle={{ background: '#19232f', color: '#fff' }}
                contentArrowStyle={{ borderRight: '7px solid #19232f' }}
                date={m1.intDate?.format('LLL') ?? '-'}
                iconStyle={{ width: '40px', height: '40px', marginLeft: '-21px', marginTop: '10px', background: '#19232f', color: '#fff', boxShadow: '0 0 0 2px #ababab' }}
                icon={<div style={{ paddingBottom: '2px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon1}</div>}
              >
                {mS}
              </VerticalTimelineElement>
            );
          })}
        </VerticalTimeline>
      );
    }
    return null;
  }, [metrics, usage, metricsEnabled]);

  const enableCheckboxes = useMemo(() => {
    if (metrics) {
      const fvaPlotArtifacts = 'fvaPlotArtifacts';
      const featureImportance = 'featureImportance';
      const detailedMetrics = 'detailedMetrics';
      const removeKeys = [fvaPlotArtifacts, featureImportance, detailedMetrics];

      let res = [];
      let mm = metrics[0]?.metricNames;
      mm?.some((m1) => {
        let k1 = Object.keys(m1)[0];
        if (k1 != null && !removeKeys.includes(k1)) {
          res.push('' + k1);
        }
      });

      return res?.map((r1) => {
        const k1 = r1;
        return (
          <span key={'ch_' + r1}>
            <Checkbox
              checked={metricsEnabled.includes(r1)}
              onChange={(e) => {
                let mm = [...metricsEnabled];
                if (mm.includes(k1)) {
                  mm = mm.filter((v1) => v1 !== k1);
                } else {
                  mm.push(k1);
                }
                setMetricsEnabled(mm);
              }}
            >
              <span style={{ color: 'white' }}>{r1}</span>
            </Checkbox>
          </span>
        );
      });
    }
    return null;
  }, [metrics, metricsEnabled]);

  return (
    <div
      css={`
        .vertical-timeline::before {
          width: 2px;
          left: 19px;
          background: #ababab;
        }
        .vertical-timeline-element-content {
          box-shadow: 0 3px 0 #888888;
        }
      `}
    >
      <div className={sd.classScreenTitle}>Project History</div>
      <div
        css={`
          text-align: center;
          margin: 6px 0;
        `}
      >
        {enableCheckboxes}
      </div>
      <div>{renderMetrics}</div>
    </div>
  );
});

export default MetricsHistory;
