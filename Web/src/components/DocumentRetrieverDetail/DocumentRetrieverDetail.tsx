import { QuestionCircleOutlined } from '@ant-design/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LinearProgress } from '@mui/material';
import { Button } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';

import { useAppSelector } from '../../../core/hooks';
import Location from '../../../core/Location';
import Utils, { calcImgSrc } from '../../../core/Utils';
import REClient_ from '../../api/REClient';

import sd from '../antdUseDark.module.css';
import CopyText from '../CopyText/CopyText';
import DateOld from '../DateOld/DateOld';
import HelpIcon from '../HelpIcon/HelpIcon';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import { DetailCreatedAt, DetailHeader, DetailName, DetailValue } from '../ModelDetail/DetailPages';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import TableExt from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';

import { DocumentRetrieverSelector } from './DocumentRetrieverSelector';

export const DocumentRetrieverDetail = React.memo(function DocumentRetrieverDetail() {
  const projectId = useAppSelector((state) => state.paramsProp?.get('projectId'));
  const documentRetrieverId = useAppSelector((state) => state.paramsProp?.get('documentRetrieverId'));

  const [isProcessing, setIsProcessing] = useState(false);
  const [documentRetrieverVersionsData, setDocumentRetrieverVersionsData] = useState<any[]>([]);
  const [detailData, setDetailData] = useState<any>({});

  useEffect(() => {
    setIsProcessing(true);
    if (!documentRetrieverId) {
      return;
    }
    REClient_.promisesV2()
      .describeDocumentRetriever(documentRetrieverId)
      .then((res) => {
        setDetailData(res.result);
      })
      .finally(() => {
        setIsProcessing(false);
      });
  }, [documentRetrieverId]);

  function fetchDocumentRetrieverVersions(documentRetrieverId: string) {
    return REClient_.promisesV2()
      .listDocumentRetrieverVersions(documentRetrieverId)
      .then((res) => {
        setDocumentRetrieverVersionsData(res?.result);
        if (!res?.result?.every((row) => ['FAILED', 'COMPLETE'].includes(row.status))) {
          setTimeout(() => {
            fetchDocumentRetrieverVersions(documentRetrieverId);
          }, 5000);
        }
      });
  }

  useEffect(() => {
    if (!documentRetrieverId) {
      return;
    }
    fetchDocumentRetrieverVersions(documentRetrieverId);
  }, [documentRetrieverId]);

  const mainDocumentRetrieverDetails = useMemo(() => {
    const mainDetails = [
      {
        name: 'Document Retriever ID:',
        value: <CopyText>{detailData?.vectorStoreId}</CopyText>,
        helpId: null,
      },
      {
        name: 'Latest Document Retriever Version:',
        value: detailData?.latestVectorStoreVersion?.vectorStoreVersion,
        helpId: null,
      },
    ];

    if (detailData?.vectorStoreConfig?.chunkSize != null) {
      mainDetails.push({
        name: 'Chunk Size:',
        value: detailData?.vectorStoreConfig?.chunkSize,
        helpId: 'document_retriever_details_chunk_size',
      });
    }

    if (detailData?.vectorStoreConfig?.chunkOverlapFraction != null) {
      mainDetails.push(
        detailData?.vectorStoreConfig?.chunkOverlapFraction != null && {
          name: 'Chunk Overlap Fraction:',
          value: detailData?.vectorStoreConfig?.chunkOverlapFraction,
          helpId: 'document_retriever_details_overlap',
        },
      );
    }

    if (detailData?.vectorStoreConfig?.textEncoder != null) {
      mainDetails.push(
        detailData?.vectorStoreConfig?.textEncoder != null && {
          name: 'Text Encoder:',
          value: detailData?.vectorStoreConfig?.textEncoder?.toUpperCase(),
          helpId: 'document_retriever_details_text_encoder',
        },
      );
    }
    return mainDetails;
  }, [detailData?.vectorStoreConfig, detailData?.latestvectorStoreVersion]);

  return (
    <div
      css={`
        margin: 25px;
      `}
      className={sd.absolute}
    >
      <NanoScroller onlyVertical onScrollBottom={() => {}}>
        <RefreshAndProgress isMsgAnimRefresh={isProcessing} msgMsg={isProcessing ? 'Loading...' : undefined} isDim={isProcessing}>
          <div
            className={sd.titleTopHeaderAfter}
            style={{ height: topAfterHeaderHH }}
            css={`
              display: flex;
            `}
          >
            <span>Document Retriever</span>
            <DocumentRetrieverSelector
              projectId={projectId}
              currentDocumentRetrieverId={documentRetrieverId}
              onChange={(newDocumentRetrieverId) => {
                Location.push(['', PartsLink.document_retriever_detail, projectId, newDocumentRetrieverId].join('/'));
              }}
            />
            <span
              css={`
                flex: 1;
              `}
            ></span>
            <span>
              <span style={{ marginRight: '20px' }}>
                <ModalConfirm
                  onConfirm={() => {
                    REClient_.promisesV2()
                      .deleteDocumentRetriever(documentRetrieverId)
                      .then((res) => {
                        Location.push(['', PartsLink.document_retriever_list, projectId].join('/'));
                      });
                  }}
                  title={`Do you want to remove the document retriever ${detailData?.name}?`}
                  icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                  okText={'Delete'}
                  cancelText={'Cancel'}
                  okType={'danger'}
                >
                  <Button
                    danger
                    ghost
                    style={{
                      height: '30px',
                      padding: '0 16px',
                      borderColor: 'transparent',
                    }}
                  >
                    Delete
                  </Button>
                </ModalConfirm>
              </span>
            </span>
          </div>
          {/* Main Details */}
          <div style={{ display: 'flex' }} className={sd.backdetail}>
            <div style={{ marginRight: '24px' }}>
              <img src={calcImgSrc('/imgs/modelIcon.png')} alt={''} style={{ width: '80px' }} />
            </div>
            <div
              style={{
                flex: 1,
                fontSize: '14px',
                fontFamily: 'Roboto',
                color: '#8798ad',
              }}
            >
              <div style={{ marginBottom: '10px' }}>
                <DetailHeader>{detailData.name}</DetailHeader>
                <span
                  onClick={() => {
                    Location.push(['', PartsLink.document_retriever_edit, projectId, documentRetrieverId].join('/'));
                  }}
                  css={`
                    margin-left: 6px;
                    opacity: 0.3;
                    :hover {
                      opacity: 1;
                    }
                  `}
                >
                  <TooltipExt title={'Edit'}>
                    <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faEdit').faEdit} transform={{ size: 15, x: -3, y: 0 }} style={{ color: 'white', cursor: 'pointer', marginLeft: '4px' }} />
                  </TooltipExt>
                </span>
              </div>
              {mainDocumentRetrieverDetails.map((d1, i) => (
                <div key={i} style={{ margin: '5px 0' }}>
                  <span>
                    <DetailName>{d1.name}</DetailName> <DetailValue style={{ color: '#ffffff' }}>{d1.value}</DetailValue>
                    {d1.helpId != null && <HelpIcon id={d1.helpId} style={{ marginLeft: 5, marginBottom: 4 }} />}
                  </span>
                </div>
              ))}
            </div>
            <div
              style={{
                textAlign: 'right',
                whiteSpace: 'nowrap',
                paddingLeft: '10px',
              }}
            >
              {detailData?.createdAt != null && (
                <div>
                  <DetailCreatedAt>Created At: {<DateOld always date={detailData?.createdAt} />}</DetailCreatedAt>
                </div>
              )}
              {detailData?.createdBy != null && (
                <div>
                  <DetailCreatedAt>Created By: {detailData?.createdBy}</DetailCreatedAt>
                </div>
              )}
            </div>
          </div>
          {/* Create New Version */}
          <ModalConfirm
            onConfirm={() => {
              REClient_.promisesV2()
                .createDocumentRetrieverVersion(documentRetrieverId)
                .then((res) => {
                  setDocumentRetrieverVersionsData((s) => [res?.result, ...s]);
                  return fetchDocumentRetrieverVersions(documentRetrieverId);
                });
            }}
            title={`Do you want to create a new version?`}
            icon={<QuestionCircleOutlined style={{ color: 'green' }} />}
            okText={'Create'}
            cancelText={'Cancel'}
            okType={'primary'}
          >
            <Button
              type={'primary'}
              style={{
                marginLeft: '0',
                marginTop: '20px',
                height: '30px',
                padding: '0 16px',
              }}
              className={sd.detailbuttonblue}
            >
              <span>Create New Version</span>
            </Button>
          </ModalConfirm>

          {/* Versions table */}
          <div style={{ margin: '30px 0' }}>
            <div
              className={sd.titleTopHeaderAfter}
              css={`
                margin-bottom: 14px;
                display: flex;
                align-items: center;
              `}
            >
              Document Retriever Versions
              <HelpIcon id="documentretrievers_versions_title" style={{ marginLeft: 5, marginBottom: 4 }} />
            </div>
            <TableExt
              noHover
              isDetailTheme
              showEmptyIcon
              defaultSort={{ field: 'createdAt', isAsc: false }}
              dataSource={documentRetrieverVersionsData}
              columns={[
                {
                  title: 'Document retriever version',
                  field: 'vectorStoreVersion',
                  render: (text) => {
                    return <CopyText>{text}</CopyText>;
                  },
                },
                {
                  title: 'Created at',
                  field: 'createdAt',
                  render: (text) => {
                    return <DateOld date={text} always />;
                  },
                },
                {
                  title: 'Status',
                  helpId: 'documentretrievers_versions_status',
                  field: 'status',
                  render: (text) => {
                    return (
                      <span>
                        {Utils.upperFirst(text)}
                        {!['FAILED', 'COMPLETE'].includes(text) && (
                          <LinearProgress
                            style={{
                              backgroundColor: 'transparent',
                              height: '6px',
                            }}
                          />
                        )}
                      </span>
                    );
                  },
                },
                {
                  title: 'Feature group version',
                  helpId: 'documentretrievers_versions_feature_group_version',
                  field: 'featureGroupVersion',
                  render: (text) => {
                    return <CopyText>{text}</CopyText>;
                  },
                },
              ]}
              calcKey={(r1) => r1.documentRetrieverVersion}
            />
          </div>
        </RefreshAndProgress>
      </NanoScroller>
    </div>
  );
});
