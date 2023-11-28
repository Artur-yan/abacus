import LinearProgress from '@mui/material/LinearProgress';
import Button from 'antd/lib/button';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useAppSelector } from '../../../core/hooks';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import Checkbox from 'antd/lib/checkbox';
import REClient_ from '../../api/REClient';
import { usePipeline, usePipelineVersions } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import { PipelineLifecycle } from '../../stores/reducers/pipelines';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
import CopyText from '../CopyText/CopyText';
import DateOld from '../DateOld/DateOld';
import EditorElem from '../EditorElem/EditorElem';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import { DetailCreatedAt, DetailHeader, DetailName, DetailValue } from '../ModelDetail/DetailPages';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import PipelineCron from '../PipelineCron/PipelineCron';
import PipelineDagModal from '../PipelineDagModal/PipelineDagModal';
import PipelineRunModal from '../PipelineRunModal/PipelineRunModal';
import PipelineEditVariableMappings from '../PipelineEditVariableMappings/PipelineEditVariableMappings';
import PipelineVersionDagModal from '../PipelineVersionDagModal/PipelineVersionDagModal';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import ResizeHeight from '../ResizeHeight/ResizeHeight';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import PipelineVersionLogsModal from '../PipelineVersionLogsModal/PipelineVersionLogsModal';
import styles from './PipelineDetails.module.css';
import globalStyles from '../antdUseDark.module.css';
import InternalTag from '../InternalTag/InternalTag';

const pollingInterval = 3000;
const runningStatuses = ['running', 'pending'];

const PipelineDetails = React.memo(() => {
  const projectId = useAppSelector((state) => state.paramsProp?.get('projectId'));
  const pipelineId = useAppSelector((state) => state.paramsProp?.get('pipelineId'));

  const [fetchPipelineCounter, fetchPipeline] = useReducer((x) => x + 1, 0);
  const [fetchPipelineVersionsCounter, fetchPipelineVersions] = useReducer((x) => x + 1, 0);
  const [logsPipelineVersion, setLogsPipelineVersion] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isUpdatingPipeline, setIsUpdatingPipeline] = useState(false);
  const refreshVersionsIntervalId = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isProd, setIsProd] = useState(false);

  const pipeline = usePipeline(pipelineId, fetchPipelineCounter);
  const pipelineVersions = usePipelineVersions(pipelineId, fetchPipelineVersionsCounter);

  const updatePipeline = async (pipelineId, pipelineVariableMappings, cron, isProd) => {
    setIsUpdatingPipeline(true);
    try {
      await REClient_.promisesV2().updatePipeline(pipelineId, pipelineVariableMappings, cron, isProd);
      fetchPipeline();
    } catch (e) {}
    setIsUpdatingPipeline(false);
  };

  const onChangeIsProd = () => {
    setIsProd(!isProd);
    updatePipeline(pipeline?.pipelineId, [], null, !pipeline?.isProd);
  };

  const onChangeVariableMappings = (mappings) => {
    return updatePipeline(pipeline?.pipelineId, mappings, null, null);
  };

  const dataList = useMemo(() => {
    let pipelineVariableMappings = [];
    pipeline?.pipelineVariableMappings?.forEach?.((mapping: any, index: number) => {
      pipelineVariableMappings.push(
        <div key={`variable-mapping-${index}`} style={{ margin: '0px -30px 0px 30px' }}>
          <span>{`${mapping?.name}: `}</span>
          <span
            css={`
              opacity: 0.8;
            `}
          >{`${mapping?.value || 'NOT SET'}`}</span>
          <br></br>
        </div>,
      );
    });
    if (!pipelineVariableMappings.length) pipelineVariableMappings = null;

    return [
      {
        id: 111,
        name: 'Pipeline Name: ',
        value: <CopyText>{pipeline?.pipelineName}</CopyText>,
        marginVert: null,
        valueColor: null,
      },
      {
        id: 112,
        name: 'Pipeline ID: ',
        value: <CopyText>{pipeline?.pipelineId}</CopyText>,
        marginVert: null,
        valueColor: null,
      },
      {
        id: 2,
        name: (
          <>
            Pipeline Variable Mappings:
            <PipelineEditVariableMappings onConfirm={(mappings) => onChangeVariableMappings(mappings)} />
          </>
        ),
        value: pipelineVariableMappings,
        hidden: pipelineVariableMappings == null,
      },
      {
        id: 500,
        name: 'Refresh Schedule',
        value: (
          <div key={'cron_' + pipeline?.pipelineId} style={{ margin: '3px 0 3px 30px' }}>
            <PipelineCron isNew pipelineId={pipeline?.pipelineId} pipelineName={pipeline?.pipelineName} cron={pipeline?.cron} nextRun={pipeline?.nextRunTime} />
          </div>
        ),
      },
      {
        id: 600,
        name: 'Pipeline Graph:',
        value: <PipelineDagModal pipelineId={pipeline?.pipelineId} pipelineVersion={null} modalName="View" />,
      },
      {
        id: 3,
        name: 'Error: ',
        value: <span className={globalStyles.styleTextRedColor}> {pipeline?.latestPipelineVersion?.error}</span>,
        hidden: pipeline?.latestPipelineVersion?.status !== 'FAILED',
      },
      {
        id: 201,
        name: <span>Is Prod:</span>,
        value: (
          <span
            css={`
              display: inline-flex;
              align-items: center;
            `}
          >
            <Checkbox disabled={isUpdatingPipeline} checked={isProd} onChange={onChangeIsProd} />
            <span
              css={`
                margin-left: 10px;
                font-size: 13px;
                opacity: 0.7;
                font-weight: normal;
              `}
            ></span>
            <InternalTag />
          </span>
        ),
        hidden: !calcAuthUserIsLoggedIn()?.isInternal,
      },
    ].filter((v1) => !v1.hidden);
  }, [pipelineId, pipeline, isProd]);

  const createdAt = pipeline?.createdAt;

  const pipelineVersionColumns = useMemo(() => {
    let pipelineVersionColumnsList: ITableExtColumn[] = (
      [
        {
          title: 'Pipeline Version ID',
          field: 'pipelineVersion',
          isLinked: true,
          render: (text) => <CopyText>{text}</CopyText>,
        },
        {
          title: 'Started At',
          field: 'createdAt',
          render: (text) => (text == null ? '-' : <DateOld always date={text} />),
        },
        {
          title: 'Completed At',
          field: 'completedAt',
          render: (text) => (text == null ? '-' : <DateOld always date={text} />),
        },
        {
          title: 'Status',
          field: 'status',
          render: (text, row, index) => {
            const status = Utils.upperFirst(text ?? '');
            if (index || !isRunning) return status;

            return (
              <span>
                <div style={{ whiteSpace: 'nowrap' }}>{status}...</div>
                <div style={{ marginTop: 4 }}>
                  <LinearProgress style={{ backgroundColor: 'transparent', height: 6 }} />
                </div>
              </span>
            );
          },
          useSecondRowArrow: true,
          renderSecondRow: (text, row, index) => {
            let res = null;
            if ([PipelineLifecycle.FAILED].includes(row.status || '')) {
              if (row.error) {
                let m1 = row.error;
                if (m1?.indexOf('\n') > -1) {
                  let mm = m1.split('\n');
                  m1 = mm.map((m1, ind) => <div key={'m' + ind}>{m1}</div>);
                }

                res = (
                  <span
                    css={`
                      display: flex;
                      align-items: center;
                    `}
                  >
                    <span
                      css={`
                        margin-right: 5px;
                        white-space: nowrap;
                      `}
                    >
                      Error:
                    </span>
                    <span
                      css={`
                        color: #bf2c2c;
                        display: inline-block;
                      `}
                    >
                      {m1}
                    </span>
                  </span>
                );
              }
            }
            return res;
          },
        },
      ] as ITableExtColumn[]
    ).filter((v1) => !v1.hidden);
    pipelineVersionColumnsList = pipelineVersionColumnsList.concat([
      {
        noAutoTooltip: true,
        noLink: true,
        title: 'Actions',
        field: 'pipelineVersion',
        width: 256,
        render: (text, row, index) => {
          let allowDelete = true;
          if (pipelineVersions?.length < 2) {
            allowDelete = false;
          }

          return (
            <span>
              <Button className={styles.tableButton} ghost type="primary">
                <PipelineVersionDagModal pipelineVersion={row.pipelineVersion} modalName="Version Graph" />
              </Button>
              <Button className={styles.tableButton} onClick={() => setLogsPipelineVersion(row.pipelineVersion)} ghost type="primary">
                Logs
              </Button>
            </span>
          );
        },
      },
    ]);

    return pipelineVersionColumnsList;
  }, [isRunning]);

  const calcKey = useCallback((row) => {
    return row.featureGroupId;
  }, []);

  const pollPipelineVersions = () => {
    if (!isRunning) setIsRunning(true);
    StoreActions.listPipelineVersions(pipelineId, (versions) => {
      if (runningStatuses.includes(versions?.[0]?.status?.toLowerCase?.())) return;

      fetchPipelineVersions();
      setIsRunning(false);
      clearInterval(refreshVersionsIntervalId.current);
      refreshVersionsIntervalId.current = null;
    });
  };

  const onRunPipeline = async (pipelineVariableMappings) => {
    try {
      const response = await REClient_.promises_().runPipeline(pipelineId, pipelineVariableMappings);
      if (response?.error || !response?.success) throw new Error(response?.error);
      refreshVersionsIntervalId.current = setInterval(pollPipelineVersions, pollingInterval);
    } catch (error) {
      REActions.addNotificationError(error?.message || Constants.errorDefault);
    }
  };

  useEffect(() => {
    if (refreshVersionsIntervalId.current || isRunning) return;
    if (runningStatuses.includes(pipelineVersions?.[0]?.status?.toLowerCase?.())) {
      refreshVersionsIntervalId.current = setInterval(pollPipelineVersions, pollingInterval);
    }
  }, [pipelineVersions, isRunning]);

  useEffect(() => {
    setIsProd(pipeline?.isProd);
  }, [pipeline]);

  useEffect(() => () => clearInterval(refreshVersionsIntervalId.current), []);

  const editNotebookId = pipeline?.notebookId || pipeline?.steps?.[0]?.pythonFunction?.notebookId;
  const showEditButton = !Utils.isNullOrEmpty(pipelineId) && editNotebookId;

  return (
    <div className={globalStyles.absolute + ' ' + globalStyles.table} style={{ margin: '25px' }}>
      <NanoScroller onlyVertical>
        <div className={globalStyles.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
          <span>{'Pipeline Details'}</span>
        </div>
        <div style={{ display: 'flex' }} className={globalStyles.backdetail}>
          <div style={{ marginRight: 24 }}>
            <img src={calcImgSrc('/imgs/modelIcon.png')} style={{ width: 80 }} />
          </div>
          <div style={{ flex: 1, fontSize: 14, fontFamily: 'Roboto', color: '#8798ad' }}>
            <div style={{ marginBottom: 8 }}>
              <DetailHeader>{pipeline?.pipelineName}</DetailHeader>
            </div>
            {dataList.map((d1) => (
              <div key={`val_${d1.id}`} style={{ margin: `${d1.marginVert ?? 4}px 0` }}>
                <span>
                  <DetailName>{d1.name}</DetailName>
                  <DetailValue style={{ color: d1.valueColor ?? 'white' }}>{d1.value}</DetailValue>
                </span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'right', whiteSpace: 'nowrap', paddingLeft: 8 }}>
            {createdAt != null && (
              <div>
                <DetailCreatedAt>Created At: {<DateOld always date={createdAt} />}</DetailCreatedAt>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              {pipelineId && <PipelineRunModal onConfirm={onRunPipeline} />}
              {showEditButton && (
                <div style={{ marginTop: 8 }}>
                  <Link to={[`/${PartsLink.pipeline_one}/${projectId}/${encodeURIComponent(pipelineId)}`, `notebookId=${encodeURIComponent(editNotebookId)}`]}>
                    <Button type={'primary'}>Edit</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        {!Utils.isNullOrEmpty(pipeline?.codeSource?.sourceCode) && (
          <div style={{ marginTop: 16 }}>
            <div
              css={`
                display: flex;
                width: 100%;
                flex-direction: row;
                position: relative;
              `}
            >
              <div
                css={`
                  margin-bottom: 4px;
                  font-size: 17px;
                  white-space: nowrap;
                `}
              >
                Transform Spec:
              </div>
              {
                <div
                  css={`
                    position: absolute;
                    left: 0;
                    top: 100%;
                    margin-top: 4px;
                  `}
                >
                  <CopyText noText tooltipText={'Copy to Clipboard'}>
                    {pipeline?.codeSource?.sourceCode}
                  </CopyText>
                </div>
              }
            </div>
            <div
              css={`
                margin-top: 35px;
              `}
            >
              <ResizeHeight height={120} min={60} save={'fg_detail_editor_hh'}>
                {(height) => (
                  <div className={globalStyles.pointerEventsNone}>
                    <EditorElem lineNumbers readonly lang="python" validateOnCall value={pipeline?.codeSource?.sourceCode} height={height - 15} />
                  </div>
                )}
              </ResizeHeight>
            </div>
          </div>
        )}
        <div style={{ margin: '32px 0' }}>
          <div className={globalStyles.titleTopHeaderAfter} style={{ marginBottom: 16 }}>
            Pipeline Versions
            <HelpIcon id="pipelines_Pipeline_version" style={{ marginLeft: 4 }} />
          </div>
          <TableExt isDetailTheme showEmptyIcon defaultSort={{ field: 'createdAt', isAsc: false }} dataSource={pipelineVersions} columns={pipelineVersionColumns} calcKey={calcKey} />
        </div>
      </NanoScroller>
      <PipelineVersionLogsModal isModalOpen={!!logsPipelineVersion} pipelineName={pipeline?.pipelineName} pipelineVersion={logsPipelineVersion} onOk={() => setLogsPipelineVersion('')} />
    </div>
  );
});

export default PipelineDetails;
