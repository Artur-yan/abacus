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
import datasets from '../../stores/reducers/datasets';
import projectDatasetsReq from '../../stores/reducers/projectDatasets';
import { memProjectById } from '../../stores/reducers/projects';
import CopyText from '../CopyText/CopyText';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./BatchListDatasets.module.css');
const sd = require('../antdUseDark.module.css');

interface IBatchListDatasetsProps {}

const BatchListDatasets = React.memo((props: PropsWithChildren<IBatchListDatasetsProps>) => {
  const { datasetsParam, batchPredParam, projectDatasetsParam, projectsParam, paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    batchPredParam: state.batchPred,
    datasetsParam: state.datasets,
    projectsParam: state.projects,
    projectDatasetsParam: state.projectDatasets,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isProcessing, setIsProcessing] = useState(false);

  let projectId = paramsProp?.get('projectId');
  let batchPredId = paramsProp?.get('batchPredId');

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projectsParam, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projectsParam, projectId]);

  useEffect(() => {
    batchPred.memBatchDescribe(undefined, batchPredId, true);
  }, [batchPredParam, batchPredId]);
  const batchPredOne = useMemo(() => {
    return batchPred.memBatchDescribe(undefined, batchPredId, false);
  }, [batchPredParam, batchPredId]);

  const onClickNull = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const datasetIdsList = useMemo(() => {
    return batchPredOne?.batchInputs?.featureGroupDatasets?.map((d1) => d1?.originalDataset?.datasetId)?.filter((v1) => !Utils.isNullOrEmpty(v1));
  }, [batchPredOne]);

  useEffect(() => {
    if (!projectId) {
      return;
    }
    projectDatasetsReq.memDatasetsByProjectId(true, projectDatasetsParam, projectId);
  }, [projectId, projectDatasetsParam]);
  const datasetsUsed = useMemo(() => {
    if (!projectId) {
      return;
    }
    return projectDatasetsReq.memDatasetsByProjectId(false, projectDatasetsParam, projectId);
  }, [projectId, projectDatasetsParam]);

  const onChangeCheckDefaultFG = (d1, e) => {
    e.stopPropagation();
    e.preventDefault();

    let v1 = e.target.checked;
    if (v1) {
      let id1 = d1?.originalDataset?.datasetId;

      let data1 = batchPredOne?.batchInputs?.datasetIdRemap ?? {};
      data1 = { ...data1 };
      delete data1[id1];

      REClient_.client_().setBatchPredictionDatasetRemap(batchPredOne?.batchPredictionId, data1 == null ? null : JSON.stringify(data1), (err, res) => {
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

  const onChangeCheckDefault = (d1, datasetType, e) => {
    e.stopPropagation();
    e.preventDefault();

    let v1 = e.target.checked;
    if (v1) {
      REClient_.client_().setBatchPredictionDataset(batchPredOne?.batchPredictionId, datasetType, null, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          StoreActions.batchList_(projectId);
          StoreActions.batchDescribeById_(batchPredOne?.batchPredictionId);
        }
      });
    }
  };

  let columns: ITableExtColumn[] = [
    {
      field: ['dataset', 'datasetId'],
      title: 'Dataset ID',
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
      width: 120,
      isLinked: (row) => row.required !== true, //(row) => (batchPredOne?.batchInputs?.datasets?.find(v1 => v1.datasetId===row?.dataset?.datasetId)?.default===true),
    },
    {
      field: ['dataset', 'name'],
      title: 'Name',
      render: (text, row, index) => {
        if (row.required === true) {
          return <span>Dataset Type: {row.datasetType}</span>;
        }

        return text || '-';
      },
      isLinked: true,
    },
    {
      field: ['dataset', 'name'],
      title: 'Original',
      helpId: 'batchListDatasetsOriginal',
      render: (text, row, index) => {
        let d1 = batchPredOne?.batchInputs?.featureGroupDatasets?.find((v1) => v1?.originalDataset?.datasetId === row?.datasetOriginalId);
        if (d1?.hasReplacementDataset === true) {
          return d1?.originalDataset?.name;
        }

        return null;
      },
    },
    {
      title: 'Default',
      helpId: 'batchListDatasetsDefault',
      render: (text, row, index) => {
        if (row.required === true) {
          return null;
        }
        let d1 = batchPredOne?.batchInputs?.featureGroupDatasets?.find((v1) => v1?.originalDataset?.datasetId === row?.datasetOriginalId);
        let v1;
        if (d1 == null) {
          v1 = true;
        } else {
          v1 = d1?.hasReplacementDataset !== true;
        }
        return <Checkbox checked={v1} onChange={onChangeCheckDefaultFG.bind(null, d1)} onClick={onClickNull} />;
      },
      width: 90 + 22,
    },
    {
      title: 'Raw Data',
      render: (text, row, index) => {
        if (row.required === true && row?.dataset?.datasetId == null) {
          return null;
        }
        return (
          <span>
            <Link forceSpanUse to={'/' + PartsLink.dataset_raw_data + '/' + row?.dataset?.datasetId + '/' + projectId}>
              View
            </Link>
          </span>
        );
      },
      isLinked: true,
      width: 120,
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
      noAutoTooltip: true,
      noLink: true,
      title: 'Actions',
      helpId: 'batchListDatasetsActions',
      render: (text, row, index) => {
        let dt1 = batchPredOne?.batchInputs?.datasets?.find((d1) => d1.datasetId === row?.dataset?.datasetId)?.datasetType;
        if (row.required === true) {
          dt1 = row.datasetType;
        }

        return (
          <span>
            <Link
              forceSpanUse
              to={['/' + PartsLink.dataset_attach + '/' + projectId, 'datasetType=AAA&isDash=true&oriDatasetId=' + encodeURIComponent(row.datasetOriginalId ?? '-') + '&useCase=' + encodeURIComponent(foundProject1?.useCase ?? '-')]}
            >
              <Button type={'default'} ghost>
                Override
              </Button>
            </Link>
          </span>
        );
      },
      width: 170,
    },
  ];

  const datasetIds = useMemo(() => {
    return null;
  }, [batchPredOne]);

  useEffect(() => {
    if (datasetIds != null && datasetIds.length > 0) {
      datasets.memDatasetListCall(true, undefined, datasetIds);
    }
  }, [datasetsParam, datasetIds]);
  const dataList = useMemo(() => {
    let res = [];

    batchPredOne?.batchInputs?.featureGroupDatasets?.some((d1, d1ind) => {
      if (d1 != null) {
        d1 = { ...d1 };

        let r1 = d1?.replacementDataset;
        if (d1?.hasReplacementDataset !== true) {
          r1 = d1?.originalDataset;
        }

        d1.datasetOriginalId = d1?.originalDataset?.datasetId;
        d1.dataset = d1.dataset ?? {};
        d1.dataset.datasetId = r1?.datasetId;
        d1.dataset.name = r1?.name;

        res.push(d1);
      }
    });

    return res;
  }, [datasetsParam, datasetIds, batchPredOne]);

  const topHH = 60;

  const calcLinkTo = (row) => {
    let f1 = batchPredOne?.batchInputs?.datasets?.find((v1) => v1.datasetId === row?.dataset?.datasetId),
      v1 = f1?.default === true;
    if (f1?.required === true) {
      return null;
    }
    if (v1) {
      return '/' + PartsLink.dataset_detail + '/' + row?.dataset?.datasetId + '/' + projectId;
    } else {
      return '/' + PartsLink.dataset_detail + '/' + row?.dataset?.datasetId + '/' + projectId;
    }
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
                Batch Predictions - Datasets
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

export default BatchListDatasets;
