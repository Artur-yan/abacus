import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import batchPred from '../../stores/reducers/batchPred';
import featureGroups from '../../stores/reducers/featureGroups';
import CopyText from '../CopyText/CopyText';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./BatchListFeatureGroups.module.css');
const sd = require('../antdUseDark.module.css');

interface IBatchListFeatureGroupsProps {}

const BatchListFeatureGroups = React.memo((props: PropsWithChildren<IBatchListFeatureGroupsProps>) => {
  const { featureGroupsParam, datasetsParam, batchPredParam, paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    batchPredParam: state.batchPred,
    datasetsParam: state.datasets,
    featureGroupsParam: state.featureGroups,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isProcessing, setIsProcessing] = useState(false);

  let projectId = paramsProp?.get('projectId');
  let batchPredId = paramsProp?.get('batchPredId');

  useEffect(() => {
    batchPred.memBatchDescribe(undefined, batchPredId, true);
  }, [batchPredParam, batchPredId]);
  const batchPredOne = useMemo(() => {
    return batchPred.memBatchDescribe(undefined, batchPredId, false);
  }, [batchPredParam, batchPredId]);

  const onChangeCheckDefaultFG = (featureGroupId, featureType, e) => {
    e.stopPropagation();
    e.preventDefault();

    let v1 = e.target.checked;
    if (v1) {
      REClient_.client_().setBatchPredictionFeatureGroup(batchPredOne?.batchPredictionId, featureType, null, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          StoreActions.getProjectsById_(projectId);
          StoreActions.batchList_(projectId);
          StoreActions.batchDescribeById_(batchPredOne?.batchPredictionId);
        }
      });
    }
  };

  const onClickNull = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const columns: ITableExtColumn[] = [
    {
      field: 'featureGroupId',
      title: 'Feature Group ID',
      render: (text, row, index) => {
        if (row.required === true) {
          return <span>Required</span>;
        } else {
          return (
            <span>
              <CopyText>{text}</CopyText>
            </span>
          );
        }
      },
      width: 150,
      isLinked: true, //(row) => (row.required!==true),//,//(row) => (batchPredOne?.batchInputs?.featureGroups?.find(v1 => v1.featureGroupId===row?.featureGroupId)?.default===true),
    },
    {
      field: 'tableName',
      title: 'TableName',
      helpId: 'batchListFGTableName',
      render: (text, row, index) => {
        if (row.required === true) {
          return <span>Feature Group Type: {row.datasetType}</span>;
        }
        return text || Constants.custom_table_desc;
      },
    },
    {
      title: 'Default',
      helpId: 'batchListFGDefault',
      render: (text, row, index) => {
        if (row.required === true) {
          return null;
        }
        let d1 = batchPredOne?.batchInputs?.featureGroups?.find((v1) => v1.featureGroupId === row?.featureGroupId),
          v1 = d1?.default === true;
        return <Checkbox checked={v1} onChange={onChangeCheckDefaultFG.bind(null, row?.featureGroupId, d1?.datasetType)} onClick={onClickNull} />;
      },
      width: 90 + 22,
    },
    // {
    //   title: 'Schema',
    //   render: (text, row, index) => {
    //     return <span><Link to={'/'}>View</Link></span>;
    //   },
    //   isLinked: true,
    //   width: 120,
    // },
    // {
    //   title: 'Raw Data',
    //   render: (text, row, index) => {
    //     return <span><Link to={'/'}>View</Link></span>;
    //   },
    //   isLinked: true,
    //   width: 120,
    // },
    {
      title: 'Raw Data',
      render: (text, row, index) => {
        if (row.required === true && row?.featureGroupId == null) {
          return null;
        }
        return (
          <span>
            <Link forceSpanUse to={'/' + PartsLink.features_rawdata + '/' + projectId + '/' + row?.featureGroupId}>
              View
            </Link>
          </span>
        );
      },
      isLinked: true,
      width: 120,
    },
    {
      noAutoTooltip: true,
      noLink: true,
      title: 'Actions',
      helpId: 'batchListFGActions',
      render: (text, row, index) => {
        let dt1 = batchPredOne?.batchInputs?.featureGroups?.find((d1) => d1.featureGroupId === row?.featureGroupId)?.datasetType;
        if (row.required === true) {
          dt1 = row.datasetType;
        }

        return (
          <span>
            <Link forceSpanUse to={['/' + PartsLink.batchpred_add_fg + '/' + projectId + '/' + batchPredId, 'returnToBatch=true&datasetType=' + Utils.encodeRouter(dt1 || 'error')]}>
              <Button type={'default'} ghost>
                Override
              </Button>
            </Link>
            {/*{row.internalOutput && [BatchLifecycle.COMPLETE].includes(row.status) && <Button style={{ marginBottom: '4px', marginRight: '5px', }} type={'primary'} ghost onClick={() => onClickDownload(row.outputLocation)}>Download</Button>}*/}
            {/*{[BatchLifecycle.COMPLETE].includes(row.status) && <Button style={{ marginBottom: '4px', marginRight: '5px', }} type={'default'} ghost onClick={(e) => onClickCopyUrl(row.outputLocation, e)}>*/}
            {/*  <TooltipExt title={row.internalOutput ? 'Copy Download Link' : 'Copy Output URI'}>*/}
            {/*    <FontAwesomeIcon icon={require('@fortawesome/free-solid-svg-icons/faClone').faClone} transform={{ size: 16, x: 0, y: 0, }} />*/}
            {/*  </TooltipExt>*/}
            {/*</Button>}*/}
          </span>
        );
      },
      width: 170,
    },
  ];

  const fgIds = useMemo(() => {
    return batchPredOne?.batchInputs?.featureGroups?.map((v1) => v1.featureGroupId);
  }, [batchPredOne]);

  useEffect(() => {
    featureGroups.memFeatureGroupsForProjectId(true, projectId);
  }, [featureGroupsParam, projectId]);
  const dataList = useMemo(() => {
    if (fgIds != null && fgIds.length > 0) {
      let res = featureGroups.memFeatureGroupsForProjectId(false, projectId);
      if (res != null && !_.isEmpty(res)) {
        res = res?.filter((v1) => fgIds?.includes(v1.featureGroupId));
      } else {
        res = null;
      }

      const dd = batchPredOne?.batchInputs?.featureGroups?.filter((v1) => v1.required == true && !v1.featureGroupId);
      if (dd.length > 0) {
        res = res ?? [];
        res = res.concat(dd);
      }

      return res ?? [];
    }
  }, [featureGroupsParam, fgIds, projectId]);

  const calcLinkTo = (row) => {
    return '/' + PartsLink.feature_group_detail + '/' + projectId + '/' + row?.featureGroupId;
    // let f1 = batchPredOne?.batchInputs?.featureGroups?.find(v1 => v1.featureGroupId === row?.featureGroupId), v1 = f1?.default===true;
    // if(f1?.required===true) {
    //   return null;
    // }
    // if(v1) {
    //   return null;
    // } else {
    //   return null;
    // }
  };

  useEffect(() => {
    batchPred.memBatchList(undefined, projectId, null, true);
  }, [projectId, batchPredParam]);
  const batchList = useMemo(() => {
    return batchPred.memBatchList(undefined, projectId, null, false);
  }, [projectId, batchPredParam]);

  const optionsBatchPred = useMemo(() => {
    return batchList?.map((b1) => ({ label: b1.name, value: b1.batchPredictionId }));
  }, [batchList]);
  const optionsBatchPredSel = useMemo(() => {
    let optionsBatchPredSel = optionsBatchPred?.find((b1) => b1.value === batchPredId);
    if (optionsBatchPredSel == null && batchPredOne != null) {
      optionsBatchPredSel = { label: batchPredOne?.name, value: null };
    }
    return optionsBatchPredSel;
  }, [optionsBatchPred, batchPredId]);

  const onChangeSelectURLDirectBatchPred = (option1) => {
    Location.push('/' + paramsProp?.get('mode') + '/' + projectId + '/' + option1?.value);
  };

  let popupContainerForMenu = (node) => document.getElementById('body2');

  const topHH = 60;

  return (
    <div
      css={`
        margin: 30px;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      `}
    >
      <AutoSizer>
        {({ height, width }) => (
          <div
            css={`
              width: ${width}px;
              height: ${height}px;
            `}
          >
            <div
              className={sd.titleTopHeaderAfter}
              css={`
                display: flex;
                align-items: center;
              `}
            >
              <span
                css={`
                  margin-right: 15px;
                `}
              >
                Batch Predictions - Feature Groups
              </span>
              <span style={{ verticalAlign: 'top', paddingTop: '2px', marginLeft: '16px', width: '440px', display: 'inline-block', fontSize: '12px' }}>
                <SelectExt isDisabled={batchPredOne == null} value={optionsBatchPredSel} options={optionsBatchPred} onChange={onChangeSelectURLDirectBatchPred} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
              </span>
              <span
                css={`
                  flex: 1;
                `}
              ></span>
            </div>

            <div
              css={`
                position: absolute;
                top: ${topHH}px;
                left: 0;
                right: 0;
                bottom: 0;
              `}
            >
              <RefreshAndProgress msgMsg={isProcessing ? 'Processing...' : null} isMsgAnimRefresh>
                <TableExt isVirtual showEmptyIcon={true} height={height} dataSource={dataList} columns={columns} calcKey={(r1) => r1?.dataset?.datasetId} calcLink={calcLinkTo} />
              </RefreshAndProgress>
            </div>
          </div>
        )}
      </AutoSizer>
    </div>
  );
});

export default BatchListFeatureGroups;
