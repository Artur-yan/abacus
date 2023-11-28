import * as moment from 'moment';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import LinearProgress from '@mui/material/LinearProgress';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Utils from '../../../core/Utils';
import UtilsWeb from '../../../core/UtilsWeb';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useDeploymentsForProject } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import batchPred, { BatchPredLifecycle, BatchPredLifecycleDesc } from '../../stores/reducers/batchPred';
import { memProjectById } from '../../stores/reducers/projects';
import CopyText from '../CopyText/CopyText';
import DateOld from '../DateOld/DateOld';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import StarredSpan from '../StarredSpan/StarredSpan';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./BatchList.module.css');
const sd = require('../antdUseDark.module.css');

export enum BatchLifecycle {
  PENDING = 'PENDING',
  PREDICTING = 'PREDICTING',
  COMPLETE = 'COMPLETE',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export const BatchLifecycleDesc = {
  [BatchLifecycle.PENDING]: Utils.upperFirst('Pending'),
  [BatchLifecycle.PREDICTING]: Utils.upperFirst('PREDICTING'),
  [BatchLifecycle.COMPLETE]: Utils.upperFirst('COMPLETE'),
  [BatchLifecycle.CANCELLED]: Utils.upperFirst('CANCELLED'),
  [BatchLifecycle.FAILED]: Utils.upperFirst('FAILED'),
};

interface IBatchListProps {
  useDeployIdIfEmpty?: string;
}

const BatchList = React.memo((props: PropsWithChildren<IBatchListProps>) => {
  const {
    paramsProp,
    batchPred: batchPredParam,
    deploymentsParam,
    projectsParam,
  } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    batchPred: state.batchPred,
    projectsParam: state.projects,
    deploymentsParam: state.deployments,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isProcessing, setIsProcessing] = useState(false);

  let projectId = paramsProp?.get('projectId');
  let deployId = paramsProp?.get('deployId') || props.useDeployIdIfEmpty;

  const deployList = useDeploymentsForProject(projectId);

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projectsParam, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projectsParam, projectId]);

  useEffect(() => {
    batchPred.memBatchList(undefined, projectId, deployId, true);
  }, [batchPredParam, projectId, deployId]);
  let batchList = useMemo(() => {
    let res = batchPred.memBatchList(undefined, projectId, deployId);

    res = res?.sort((a, b) => {
      let res = 0;
      if (a.starred && !b.starred) {
        res = -1;
      } else if (!a.starred && b.starred) {
        res = 1;
      }
      if (res === 0) {
        let ma = a.createdAt;
        let mb = b.createdAt;
        if (ma && mb) {
          res = moment(mb).diff(moment(ma));
        }
      }
      return res;
    });

    return res;
  }, [batchPredParam, projectId, deployId]);

  const onClickDownload = (url) => {
    window.location.href = url;
  };
  const onClickCopyUrl = (url, e) => {
    e && e.preventDefault();

    UtilsWeb.copyToClipboard(url);

    REActions.addNotification('Copied to clipboard!');
  };
  const onClickStopBatch = (batchPredictionId) => {
    REClient_.client_()._cancelBatchPrediction(batchPredictionId, (err, res) => {
      if (err || !res || !res.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.batchList_(projectId);
      }
    });
  };
  const onClickStarred = (batchPredictionId, starred, e) => {
    REClient_.client_()._starBatchPrediction(batchPredictionId, starred, (err, res) => {
      StoreActions.batchDescribeById_(batchPredictionId);
      StoreActions.batchList_(projectId);
    });
  };

  let columns: ITableExtColumn[] = [
    {
      title: '',
      field: 'starred',
      helpId: '',
      noAutoTooltip: true,
      render: (starred, row, index) => {
        return <StarredSpan name={'Batch Prediction'} isStarred={starred} onClick={onClickStarred.bind(null, row.batchPredictionId)} />;
      },
      width: 45,
    },
    {
      title: 'Created At',
      field: 'createdAt',
      render: (text, row, index) => {
        return text == null ? '-' : <DateOld always date={text} />;
      },
      width: 200,
    },
    {
      field: 'batchPredictionId',
      title: 'Batch ID',
      helpId: 'batchlist_id',
      render: (text, row, index) => {
        return (
          <span>
            <CopyText>{text}</CopyText>
          </span>
        );
      },
      width: 120,
      noAutoTooltip: true,
    },
    {
      field: 'name',
      title: 'Name',
      isLinked: true,
      helpId: 'batchlist_name',
      render: (text, row, index) => {
        return text || '-';
      },
    },
    {
      title: 'Deployment',
      field: 'deploymentId',
      helpId: 'batchListDeploymentId',
      render: (text, row, index) => {
        if (deployList) {
          let d1 = deployList?.find((d1) => d1?.deploymentId === text);
          return <span>{d1?.name}</span>;
          // if(d1) {
          //   return <Link to={'/'+PartsLink.deploy_detail+'/'+projectId+'/'+text} forceSpanUse usePointer><span>{d1.name}</span></Link>;
          // }
        }
        return ''; //<Link to={'/'+PartsLink.deploy_detail+'/'+projectId+'/'+text} forceSpanUse usePointer><span>{text}</span></Link>;
      },
      noAutoTooltip: true,
      // isLinked: true,
    },
    {
      title: 'Prediction Status',
      field: 'latestBatchPredictionVersion',
      helpId: 'batchPredVersions_status',
      render: (text, row, index) => {
        if (!text) {
          return 'Not available';
        }
        if ([BatchPredLifecycle.PREDICTING, BatchPredLifecycle.UPLOADING, BatchPredLifecycle.PENDING].includes(text?.status || '')) {
          StoreActions.refreshDoBatchVersionsAll_(text.batchPredictionId, text.batchPredictionVersion, projectId);
          return (
            <span>
              <div style={{ whiteSpace: 'nowrap' }}>{BatchPredLifecycleDesc[text?.status ?? '']}...</div>
              <div style={{ marginTop: '5px' }}>
                <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
              </div>
            </span>
          );
        }
        let res = <span style={{ whiteSpace: 'nowrap' }}>{BatchPredLifecycleDesc[text?.status ?? '-']}</span>;
        if ([BatchPredLifecycle.FAILED].includes(text?.status || '')) {
          res = (
            <div>
              <span className={sd.red}>{res}</span>
              {text?.error ? (
                <TooltipExt placement="bottom" overlay={<span style={{ whiteSpace: 'pre-wrap' }}>{text.error}</span>}>
                  <FontAwesomeIcon icon={['far', 'exclamation-circle']} transform={{ size: 15, x: -4 }} style={{ opacity: 0.7, color: 'red', marginLeft: '6px' }} />
                </TooltipExt>
              ) : null}
            </div>
          );
        }
        return res;
      },
      width: 180 + 12,
    },
    {
      title: 'Datasets',
      helpId: 'batchListDatasets',
      render: (text, row, index) => {
        return (
          <span>
            <Link forceSpanUse to={'/' + PartsLink.batchpred_datasets + '/' + projectId + '/' + row.batchPredictionId}>
              View
            </Link>
          </span>
        );
      },
      isLinked: true,
      width: 100 + 22,
    },
    {
      title: 'Feature Groups',
      helpId: 'batchListFG',
      render: (text, row, index) => {
        return (
          <span>
            <Link forceSpanUse to={'/' + PartsLink.batchpred_featuregroups + '/' + projectId + '/' + row.batchPredictionId}>
              View
            </Link>
          </span>
        );
      },
      isLinked: true,
      width: 146 + 22,
    },
    // {
    //   noAutoTooltip: true,
    //   title: 'Actions',
    //   helpId: 'batchlist_actions',
    //   render: (text, row, index) => {
    //     return <span>
    //       {row.internalOutput && [BatchLifecycle.COMPLETE].includes(row.status) && <Button style={{ marginBottom: '4px', marginRight: '5px', }} type={'primary'} ghost onClick={() => onClickDownload(row.outputLocation)}>Download</Button>}
    //       {[BatchLifecycle.COMPLETE].includes(row.status) && <Button style={{ marginBottom: '4px', marginRight: '5px', }} type={'default'} ghost onClick={(e) => onClickCopyUrl(row.outputLocation, e)}>
    //         <TooltipExt title={row.internalOutput ? 'Copy Download Link' : 'Copy Output URI'}>
    //           <FontAwesomeIcon icon={require('@fortawesome/free-solid-svg-icons/faClone').faClone} transform={{ size: 16, x: 0, y: 0, }} />
    //         </TooltipExt>
    //       </Button>}
    //       {(row.externalConnectionError) && <Button style={{ marginBottom: '4px', marginRight: '5px', }} danger ghost onClick={() => onClickDownload('/api/v0/getBatchPredictionConnectorErrors?batchPredictionId=' + row.batchPredictionId)}>Errors</Button>}
    //       {false && [BatchLifecycle.PENDING, BatchLifecycle.PREDICTING].includes(row.status) && <ModalConfirm onConfirm={() => onClickStopBatch(row.batchPredictionId)} title={`Do you want to stop this batch predicting?`} icon={<QuestionCircleOutlined style={{ color: 'red' }} />} okText={'Stop'} cancelText={'Cancel'} okType={'danger'}>
    //         <Button style={{ marginBottom: '4px', marginRight: '5px', }} danger ghost>Stop</Button>
    //       </ModalConfirm>}
    //     </span>;
    //   },
    //   width: 270,
    // }
  ];

  const onCalcLink = (row) => {
    if (row?.batchPredictionId == null) {
      return null;
    } else {
      return '/' + PartsLink.batchpred_detail /*PartsLink.batchpred_create*/ + '/' + projectId + '/' + row?.batchPredictionId;
    }
  };

  return (
    <AutoSizer>
      {({ height, width }) => (
        <RefreshAndProgress msgMsg={isProcessing ? 'Processing...' : null} isMsgAnimRefresh>
          <TableExt isVirtual showEmptyIcon={true} notsaveSortState={'batch_list'} height={height} dataSource={batchList} columns={columns} calcKey={(r1) => r1.batchPredictionId} calcLink={onCalcLink} />
        </RefreshAndProgress>
      )}
    </AutoSizer>
  );
});

export default BatchList;
