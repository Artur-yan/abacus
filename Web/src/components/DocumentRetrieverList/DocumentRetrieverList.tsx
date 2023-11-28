import { LinearProgress } from '@mui/material';
import { Button } from 'antd';
import React, { useEffect, useState } from 'react';
import { AutoSizer } from 'react-virtualized';

import { useAppSelector, useIsComponentMounted } from '../../../core/hooks';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';

import REClient_ from '../../api/REClient';

import sd from '../antdUseDark.module.css';
import CopyText from '../CopyText/CopyText';
import HelpIcon from '../HelpIcon/HelpIcon';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import TableExt from '../TableExt/TableExt';

function TextHeading({ children }: { children: string }) {
  return <span className={sd.titleTopHeaderAfter}>{children}</span>;
}

function isTerminalStatus(status: string) {
  return ['FAILED', 'COMPLETE'].includes(status);
}

function DocumentRetrieverStatus(props: { status: string; documentRetrieverId: string; refreshRow: (newRow: any) => void }) {
  const isComponentMounted = useIsComponentMounted();

  useEffect(() => {
    let timerId;
    function refreshRowIfRequired() {
      REClient_.promisesV2()
        .describeDocumentRetriever(props.documentRetrieverId)
        .then((res) => {
          if (!isComponentMounted) {
            return;
          }
          if (!isTerminalStatus(res?.result?.latestVectorStoreVersion?.status)) {
            timerId = setTimeout(refreshRowIfRequired, 5000);
          } else {
            props.refreshRow(mapToDocumentRetrieverRowView(res.result));
          }
        });
    }

    if (!isTerminalStatus(props.status)) {
      refreshRowIfRequired();
    }

    return () => {
      clearTimeout(timerId);
    };
  }, [props.documentRetrieverId]);

  return (
    <span>
      {Utils.upperFirst(props.status ?? '')}
      {!isTerminalStatus(props.status) && (
        <LinearProgress
          style={{
            backgroundColor: 'transparent',
            height: '6px',
          }}
        />
      )}
    </span>
  );
}

function mapToDocumentRetrieverRowView(row) {
  return {
    ...row,
    latestDocumentRetrieverVersion: row?.latestVectorStoreVersion?.vectorStoreVersion,
    latestDocumentRetrieverCreatedAt: row?.latestVectorStoreVersion?.createdAt,
    latestDocumentRetrieverStatus: row?.latestVectorStoreVersion?.status,
  };
}

export const DocumentRetrieverList = React.memo(function DocumentRetrieverList() {
  const projectId = useAppSelector((state) => state.paramsProp?.get('projectId'));

  const [isProcessing, setIsProcessing] = useState(false);
  const [documentRetrieverRowData, setDocumentRetrieverRowData] = useState<any[]>([]);

  useEffect(() => {
    setIsProcessing(true);
    REClient_.promisesV2()
      .listDocumentRetrievers(projectId)
      .then((res) => {
        setDocumentRetrieverRowData(res?.result.map(mapToDocumentRetrieverRowView));
      })
      .finally(() => {
        setIsProcessing(false);
      });
  }, []);

  return (
    <div
      css={`
        margin: 25px;
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
      `}
    >
      <div
        css={`
          display: flex;
          align-items: center;
        `}
      >
        <TextHeading>Document Retrievers</TextHeading>
        <HelpIcon id="documentretrievers_list_title" style={{ marginLeft: 5, marginTop: 4 }} />
        <div
          css={`
            flex: 1;
          `}
        ></div>
        <Button
          style={{ height: '30px', padding: '0 16px' }}
          type={'primary'}
          onClick={() => {
            Location.push(['', PartsLink.document_retriever_create, projectId].join('/'));
          }}
        >
          Create Document Retriever
        </Button>
      </div>
      <AutoSizer disableWidth>
        {({ height }) => (
          <RefreshAndProgress isRefreshing={isProcessing} style={{ top: topAfterHeaderHH }}>
            <TableExt
              showEmptyIcon={true}
              isVirtual
              height={height - topAfterHeaderHH}
              remoteRowCount={Infinity}
              dataSource={documentRetrieverRowData}
              columns={[
                {
                  title: 'ID',
                  field: 'vectorStoreId',
                  render: (text) => {
                    return <CopyText className={sd.styleTextBlue}>{text}</CopyText>;
                  },
                },
                {
                  title: 'Document Retriever Name',
                  field: 'name',
                  render: (text) => {
                    return <span className={sd.linkBlue}>{text}</span>;
                  },
                },
                {
                  title: 'Latest Document Retriever Version',
                  helpId: 'documentretrievers_latest_version',
                  field: 'latestDocumentRetrieverVersion',
                  render: (text) => {
                    return <CopyText>{text}</CopyText>;
                  },
                },
                {
                  title: 'Status',
                  helpId: 'documentretrievers_latest_status',
                  field: 'latestDocumentRetrieverStatus',
                  render: (text, row) => {
                    return (
                      <DocumentRetrieverStatus
                        status={text}
                        documentRetrieverId={row.vectorStoreId}
                        refreshRow={(newRow) => {
                          setDocumentRetrieverRowData((rows) =>
                            rows.map((r) => {
                              if (r.vectorStoreId === newRow.vectorStoreId) {
                                return { ...newRow };
                              }
                              return r;
                            }),
                          );
                        }}
                      />
                    );
                  },
                },
              ]}
              calcKey={(row) => row.vectorStoreId}
              calcLink={(row) => ['', PartsLink.document_retriever_detail, projectId, row.vectorStoreId].join('/')}
            />
          </RefreshAndProgress>
        )}
      </AutoSizer>
    </div>
  );
});
