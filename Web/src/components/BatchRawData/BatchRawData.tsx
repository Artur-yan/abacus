import Button from 'antd/lib/button';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import REClient_ from '../../api/REClient';
import { memProjectById } from '../../stores/reducers/projects';
import CopyText from '../CopyText/CopyText';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TextMax from '../TextMax/TextMax';
const s = require('./BatchRawData.module.css');
const sd = require('../antdUseDark.module.css');

interface IBatchRawDataProps {}

const BatchRawData = React.memo((props: PropsWithChildren<IBatchRawDataProps>) => {
  const { paramsProp, authUser, projectsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    projectsParam: state.projects,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataList, setDataList] = useState(null);
  const [lastRowId, setLastRowId] = useState(null);
  const [isNoMore, setIsNoMore] = useState(false);

  const pageCount = 40;

  const batchPredVersion = paramsProp?.get('batchPredVersion');
  const projectId = paramsProp?.get('projectId');
  const useModelId = paramsProp?.get('useModelId');
  const useDeployId = paramsProp?.get('useDeployId');

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projectsParam, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projectsParam, projectId]);
  const isPnpPython = foundProject1?.isPnpPython === true;

  const doGetData = (forceRestart = false) => {
    setIsRefreshing((isR) => {
      if (!isR) {
        setLastRowId((startAfter) => {
          if (forceRestart) {
            startAfter = null;
            setIsNoMore(false);
          }

          setIsRefreshing(true);

          REClient_.client_()._getBatchPredictionRows(batchPredVersion, pageCount, startAfter, (err, res) => {
            setIsRefreshing(false);

            if (err || !res?.success) {
            } else {
              let resList = res?.result ?? [];
              if (resList.length < pageCount) {
                setIsNoMore(true);
              }

              setDataList((list) => {
                list = [...(list ?? [])];
                if (forceRestart) {
                  list = [];
                }
                list = list.concat(resList);

                return list;
              });
              setLastRowId(resList?.[resList?.length - 1]?.index + 1);
            }
          });

          return startAfter;
        });
      }

      return isR;
    });
  };

  useEffect(() => {
    if (batchPredVersion) {
      doGetData(true);
    }
  }, [batchPredVersion]);

  let columns: ITableExtColumn[] = [
    {
      title: 'Row #',
      render: (text, row, index) => {
        return <span>{index + 1}</span>;
      },
      width: 80,
      isLinked: true,
    },
    {
      title: 'Raw Input',
      width: 160,
      render: (text, row, index) => {
        let s1 = JSON.stringify(row.input ?? '');
        return (
          <span>
            <span
              css={`
                margin-right: 8px;
              `}
            >
              <CopyText noText>{s1}</CopyText>
            </span>
            <TextMax max={160}>{s1}</TextMax>
          </span>
        );
      },
      noAutoTooltip: true,
    },
    {
      title: 'Output',
      render: (text, row, index) => {
        let s1 = JSON.stringify(row.prediction ?? '');
        return (
          <span>
            <span
              css={`
                margin-right: 8px;
              `}
            >
              <CopyText noText>{s1}</CopyText>
            </span>
            <TextMax max={160}>{s1}</TextMax>
          </span>
        );
      },
      noAutoTooltip: true,
    },
    {
      noAutoTooltip: true,
      title: 'Actions',
      helpId: 'batchlist_rawdata_actions',
      render: (text, row, index) => {
        return (
          <span>
            <Button type={'default'} ghost>
              Prediction Dashboard
            </Button>
          </span>
        );
      },
      width: 200,
    },
  ];

  const calcLinkTo = useCallback(
    (row, index) => {
      if (index == null || !useModelId || !projectId || !batchPredVersion) {
        return;
      } else {
        return ['/' + (isPnpPython ? PartsLink.deploy_predictions_api : PartsLink.model_predictions) + '/' + projectId + '/' + useDeployId, 'requestBPId=' + index + '_' + batchPredVersion];
      }
    },
    [projectId, useModelId, useDeployId, batchPredVersion, isPnpPython],
  );

  const topHH = 60;

  const onNeedMoreData = useCallback(() => {
    doGetData();
  }, []);

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
                  flex: 1;
                `}
              >
                Batch Predictions - RawData
              </span>
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
                <TableExt
                  isVirtual
                  onNeedMore={onNeedMoreData}
                  remoteRowCount={(dataList?.length ?? 0) + (isNoMore ? 0 : 1)}
                  showEmptyIcon={true}
                  height={height - topHH}
                  dataSource={dataList}
                  columns={columns}
                  calcKey={(r1) => r1?.id}
                  calcLink={calcLinkTo}
                />
              </RefreshAndProgress>
            </div>
          </div>
        )}
      </AutoSizer>
    </div>
  );
});

export default BatchRawData;
