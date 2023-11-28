import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { calcImgSrc } from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import CopyText from '../CopyText/CopyText';
import DateOld from '../DateOld/DateOld';
import EditorElem from '../EditorElem/EditorElem';
import TooltipExt from '../TooltipExt/TooltipExt';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DetailCreatedAt, DetailHeader, DetailName, DetailValue } from '../ModelDetail/DetailPages';
import ResizeHeight from '../ResizeHeight/ResizeHeight';
import { useAppSelector } from '../../../core/hooks';
import classNames from 'classnames';
import InternalTag from '../InternalTag/InternalTag';
import { faEdit } from '@fortawesome/pro-regular-svg-icons/faEdit';
import UpdateNotebookTemplate from '../UpdateNotebookTemplate/UpdateNotebookTemplate';
import styles from './NotebookTemplateDetails.module.css';
import globalStyles from '../antdUseDark.module.css';

const NotebookTemplateDetails = React.memo(() => {
  const paramsProp = useAppSelector((state) => state.paramsProp);
  const [notebookTemplate, setNotebookTemplate] = useState({} as any);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '' || projectId === '-') {
    projectId = null;
  }

  let notebookTemplateId = paramsProp?.get('notebookTemplateId');

  const details = useMemo(() => {
    return [
      {
        id: 1,
        name: 'Notebook Template Name: ',
        value: <CopyText>{notebookTemplate?.name}</CopyText>,
      },
      {
        id: 2,
        name: 'Notebook Template ID: ',
        value: <CopyText>{notebookTemplate?.notebookTemplateId}</CopyText>,
      },
      {
        id: 3,
        name: 'Description: ',
        value: notebookTemplate?.description,
      },
      {
        id: 4,
        name: 'Template Type: ',
        value: notebookTemplate?.templateType,
      },
      {
        id: 4,
        name: 'Filename: ',
        value: notebookTemplate?.filename,
      },
    ];
  }, [notebookTemplate]);

  const createdAt = notebookTemplate?.createdAt;

  const getNotebookTemplate = () =>
    REClient_.promisesV2()
      ._describeNotebookTemplate(notebookTemplateId)
      .then((response) => setNotebookTemplate(response?.result || {}));

  useEffect(() => {
    if (!notebookTemplateId) return;
    getNotebookTemplate();
  }, [notebookTemplateId]);

  return (
    <div className={classNames(globalStyles.absolute, globalStyles.table)} style={{ margin: 24 }}>
      <div className={classNames(globalStyles.titleTopHeaderAfter, styles.titleContainer)}>
        <span>Notebook Template Details</span>
        <InternalTag />
      </div>
      <div style={{ display: 'flex' }} className={globalStyles.backdetail}>
        <div style={{ marginRight: 24 }}>
          <img src={calcImgSrc('/imgs/modelIcon.png')} style={{ width: 80 }} />
        </div>
        <div style={{ flex: 1, fontSize: 14, fontFamily: 'Roboto', color: '#8798ad' }}>
          <div style={{ marginBottom: 8 }}>
            {notebookTemplate?.name && (
              <>
                <DetailHeader>{notebookTemplate?.name}</DetailHeader>
                <TooltipExt title="Edit">
                  <FontAwesomeIcon
                    css={`
                      opacity: 0.7;
                      &:hover {
                        opacity: 1;
                      }
                    `}
                    icon={faEdit}
                    onClick={() => setIsUpdateModalOpen(true)}
                    transform={{ size: 20, y: -4 }}
                    style={{ color: 'white', cursor: 'pointer', marginLeft: 12 }}
                  />
                </TooltipExt>
              </>
            )}
          </div>
          {details.map((detail, index) => (
            <div key={`val_${index}`} style={{ margin: '4px 0' }}>
              <span>
                <DetailName>{detail.name}</DetailName>
                <DetailValue style={{ color: '#d1e4f5' }}>{detail.value}</DetailValue>
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
        </div>
      </div>
      {notebookTemplate?.sourceCode && (
        <div>
          <div style={{ marginTop: 16 }}>
            <CopyText noText tooltipText="Copy to Clipboard">
              {notebookTemplate?.sourceCode}
            </CopyText>
          </div>
          <div style={{ margin: '16px 0 32px' }}>
            <ResizeHeight height={120} min={60} save="fg_detail_editor_hh">
              {(height) => (
                <div className={globalStyles.pointerEventsNone}>
                  <EditorElem hideExpandFGs lineNumbers readonly lang="python" validateOnCall value={notebookTemplate?.sourceCode} height={height - 16} />
                </div>
              )}
            </ResizeHeight>
          </div>
        </div>
      )}
      <UpdateNotebookTemplate isModalOpen={isUpdateModalOpen} setIsModalOpen={setIsUpdateModalOpen} template={notebookTemplate} onSuccess={getNotebookTemplate} />
    </div>
  );
});

export default NotebookTemplateDetails;
