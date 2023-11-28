import Button from 'antd/lib/button';
import Modal from 'antd/lib/modal';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import { memProjectById } from '../../stores/reducers/projects';
import CopyText from '../CopyText/CopyText';
import DateOld from '../DateOld/DateOld';
import { DeployBatchAPI_calcListDeploy } from '../DeployBatchAPI/DeployBatchAPI';
import HelpIcon from '../HelpIcon/HelpIcon';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./PredictionLog.module.css');
const sd = require('../antdUseDark.module.css');
const { confirm } = Modal;

interface IPredictionLogProps {}

const PredictionLog = React.memo((props: PropsWithChildren<IPredictionLogProps>) => {
  const { paramsProp, authUser, projectsParam, deployments } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    deployments: state.deployments,
    projectsParam: state.projects,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [ignoredRefreshData, forceUpdateRefreshData] = useReducer((x) => x + 1, 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [listRequests, setListRequests] = useState(null as { requestId?: string; queryTimeMs?: number; query?: any; response?; timestampMs?: number }[]);
  const [reqIdsFromId, setReqIdsFromId] = useState(null);
  const reqIdsFromIdLastId = useRef(null);
  const reqIdsFromIdLastIdNoMore = useRef(null);
  const [isNotYet, setIsNotYet] = useState(false);
  const [errorAfterData, setErrorAfterData] = useState(false);
  const confirmModal = useRef(null);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }

  let deployId = paramsProp?.get('deployId');
  const deployIdNone = deployId === '-';
  if (deployIdNone) {
    deployId = null;
  }

  const refLastDeployIdUsed = useRef(null);

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projectsParam, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projectsParam, projectId]);
  const isPnp = foundProject1?.isPnp === true;
  const isPnpPython = foundProject1?.isPnpPython === true;
  const isSentimentAnalysis = foundProject1?.useCase === 'NLP_SENTIMENT';

  useEffect(() => {
    if (!deployId) {
      return;
    }

    //
    const isAllNew = reqIdsFromId == null;
    if (!isAllNew) {
      if (refLastDeployIdUsed.current !== deployId) {
        setReqIdsFromId(null);
        return;
      }
    }
    refLastDeployIdUsed.current = deployId;

    //
    if (isAllNew) {
      setListRequests(null);
    }
    setIsRefreshing(true);
    setIsNotYet(false);
    setErrorAfterData(false);

    REClient_.client_()._getRecentPredictionRequestIds(deployId, 50, reqIdsFromId, (err, res) => {
      setIsRefreshing(false);

      if (!err && res?.success) {
        setListRequests((list) => {
          if (isAllNew) {
            list = [];
          } else {
            list = [...(list ?? [])];
          }

          let resList = res?.result;
          if (resList == null || resList.length === 0) {
            reqIdsFromIdLastIdNoMore.current = true;
            setIsNotYet(true);
          } else {
            reqIdsFromIdLastIdNoMore.current = false;
            reqIdsFromIdLastId.current = resList[resList.length - 1]?.requestId;
          }

          list = list.concat(resList ?? []);

          return list;
        });
      } else {
        setListRequests((list) => {
          if (list == null || list?.length === 0) {
            setIsNotYet(true);
          } else {
            reqIdsFromIdLastIdNoMore.current = true;
            setErrorAfterData(true);
          }

          return list;
        });
      }
    });
  }, [ignoredRefreshData, deployId, reqIdsFromId]);

  useEffect(() => {
    DeployBatchAPI_calcListDeploy(deployments, deployId, projectId, true);
  }, [deployments, deployId, projectId]);

  // let listDeploymentsActive = useMemo(() => {
  //   return DeployBatchAPI_calcListDeploy(deployments, deployId, projectId, false);
  // }, [deployments, deployId, projectId]);
  let listDeployments = useMemo(() => {
    return DeployBatchAPI_calcListDeploy(deployments, deployId, projectId, false, true);
  }, [deployments, deployId, projectId]);

  let optionsDeploys = useMemo(() => {
    if (listDeployments) {
      return listDeployments.map((d1) => {
        return {
          label: d1.name || '-',
          value: d1.deploymentId,
        };
      });
    }
  }, [listDeployments]);
  let optionsDeploysSel = optionsDeploys?.find((d1) => d1.value === deployId);

  const onChangeDeploy = (option1) => {
    Location.push('/' + PartsLink.monitoring_pred_log + '/' + projectId + '/' + option1?.value);
  };

  let popupContainerForMenu = (node) => document.getElementById('body2');

  const onClickRefresh = (e) => {
    forceUpdateRefreshData();
    setReqIdsFromId(null);
  };

  const onClickModal = (s1, e) => {
    e.stopPropagation();
    e.preventDefault();

    if (confirmModal.current != null) {
      confirmModal.current.destroy();
      confirmModal.current = null;
    }

    confirmModal.current = confirm({
      title: 'Expanded',
      okText: 'Ok',
      cancelButtonProps: { style: { display: 'none' } },
      maskClosable: true,
      content: (
        <div>
          <div style={{ margin: '20px', color: 'white' }}>{s1}</div>
        </div>
      ),
      onOk: () => {
        if (confirmModal.current != null) {
          confirmModal.current.destroy();
          confirmModal.current = null;
        }
      },
      onCancel: () => {
        if (confirmModal.current != null) {
          confirmModal.current.destroy();
          confirmModal.current = null;
        }
      },
    });
  };

  useEffect(() => {
    return () => {
      if (confirmModal.current != null) {
        confirmModal.current.destroy();
        confirmModal.current = null;
      }
    };
  }, []);

  const columns = useMemo(() => {
    return [
      {
        title: 'Request  ID',
        field: 'requestId',
        render: (text, row, index) => {
          return (
            <span>
              <CopyText>{text}</CopyText>
            </span>
          );
        },
        isLinked: !isPnp,
        width: 320,
        noAutoTooltip: true,
      },
      {
        title: 'Timestamp (UTC)',
        field: 'timestampMs',
        render: (text, row, index) => {
          return text == null ? '-' : <DateOld always date={text} useUTC />;
        },
        width: 190,
      },
      {
        title: 'Query Time Ms',
        field: 'queryTimeMs',
        render: (text, row, index) => {
          return <span>{text}</span>;
        },
        width: 140,
      },
      {
        title: 'Data',
        render: (text, row, index) => {
          text = row?.query?.data;
          if (text == null) {
            text = row?.query;
            if (text != null && _.isObject(text) && !_.isArray(text)) {
              // Don't use JSON to stringify to avoid additional confusion regarding escaping of the input
              // data
              let text_arr = [];
              let kk = Object.keys(text ?? {});
              kk.some((key) => {
                if (key === 'data') {
                  return;
                }
                let s2 = text[key];
                if (_.isObject(s2)) {
                  s2 = JSON.stringify(s2);
                }
                text_arr.push(key + ': ' + s2);
              });
              text = text_arr.join(', ');
            }
          }

          let isEmpty = Utils.isNullOrEmpty(text) || _.isEmpty(text);
          if (isEmpty) {
            return <span></span>;
          }

          let s1 = text == null || _.isString(text) ? text : JSON.stringify(text);

          return (
            <span>
              <span
                css={`
                  margin-right: 8px;
                `}
              >
                <CopyText noText>{s1}</CopyText>
              </span>
              <span
                onClick={onClickModal.bind(null, s1)}
                className={sd.styleTextBlueBright}
                css={`
                  cursor: pointer;
                  margin-right: 8px;
                `}
              >
                Modal Expand
              </span>
              {s1}
            </span>
          );
        },
        noAutoTooltip: true,
      },
    ] as ITableExtColumn[];
  }, []);

  const calcKeyTable = useCallback((row) => {
    return row?.requestId;
  }, []);

  const calcLinkTable = useCallback(
    (row) => {
      let dataRow = row?.query?.data;
      let isEmpty = Utils.isNullOrEmpty(dataRow) || _.isEmpty(dataRow);

      let data1 = row.requestId;
      if (data1 == null || isPnp || isEmpty) {
        return null;
      } else {
        return ['/' + (isPnpPython || isSentimentAnalysis ? PartsLink.deploy_predictions_api : PartsLink.model_predictions) + '/' + projectId + '/' + deployId, 'requestId=' + encodeURIComponent(row.requestId)];
      }
    },
    [isPnp, isPnpPython, isSentimentAnalysis],
  );

  const calcLinkTableOnClick = useCallback((row) => {
    let data1 = row.data;
    if (data1 == null) {
      return;
    } else if (!_.isString(data1)) {
      data1 = JSON.stringify(data1);
    }
    REClient_.dataForPredDash = data1;
  }, []);

  const onNeedMore = () => {
    setIsRefreshing((isR) => {
      if (!isR && !reqIdsFromIdLastIdNoMore.current) {
        setReqIdsFromId(reqIdsFromIdLastId.current);
      }

      return isR;
    });
  };

  return (
    <div
      css={`
        position: absolute;
        top: 30px;
        left: 30px;
        right: 30px;
        bottom: 30px;
      `}
    >
      <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
        <span style={{ float: 'right' }}>
          <Button style={{}} type={'primary'} onClick={onClickRefresh}>
            Refresh
          </Button>
        </span>

        <span>
          Prediction Log
          <HelpIcon id={'mon_pred_log'} style={{ marginLeft: '4px' }} />
        </span>
        <span style={{ display: 'inline-block', verticalAlign: 'top', paddingTop: '2px', marginLeft: '16px', width: '440px', fontSize: '12px' }}>
          <SelectExt value={optionsDeploysSel} options={optionsDeploys} onChange={onChangeDeploy} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
        </span>
      </div>

      <div style={{ position: 'absolute', top: topAfterHeaderHH + 'px', left: 0, right: 0, bottom: 0 }}>
        {
          <AutoSizer disableWidth>
            {({ height }) => (
              <RefreshAndProgress isRefreshing={isRefreshing} msgMsg={isNotYet ? 'No Prediction Logs Yet' : undefined} isDim={isNotYet}>
                <TableExt
                  showEmptyIcon={true}
                  isVirtual
                  disableSort
                  height={height}
                  onNeedMore={onNeedMore}
                  remoteRowCount={(listRequests?.length ?? 0) === 0 ? 0 : !reqIdsFromIdLastIdNoMore.current ? (listRequests?.length ?? 0) + 1 : 0}
                  dataSource={listRequests}
                  columns={columns}
                  calcKey={calcKeyTable}
                  calcLink={calcLinkTable}
                  calcLinkOnClick={calcLinkTableOnClick}
                />
              </RefreshAndProgress>
            )}
          </AutoSizer>
        }
      </div>
    </div>
  );
});

export default PredictionLog;
