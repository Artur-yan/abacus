import React, { useCallback, useEffect, useRef, useState } from 'react';
import Modal from 'antd/lib/modal';
import Alert from 'antd/lib/alert';
import NanoScroller from '../NanoScroller/NanoScroller';
import CronOne from '../CronOne/CronOne';
import { useSelector } from 'react-redux';
import StoreActions from '../../stores/actions/StoreActions';
import { Button, Input } from 'antd';
import REClient_ from '../../api/REClient';
import REActions from '../../actions/REActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import TooltipExt from '../TooltipExt/TooltipExt';
import { useNotebook } from '../../api/REUses';
const styles = require('./NotebookRefreshPolicy.module.css');
const sd = require('../antdUseDark.module.css');

const NotebookRefreshPolicy = ({ isModalOpen = false, setIsModalOpen, notebook }) => {
  const { paramsProp } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
  }));
  const notebookInfo = useNotebook(notebook);
  const [isEditFileName, setIsEditFileName] = useState(false);
  const executeFileRef = useRef(null);
  const { notebookId, refreshSchedules } = notebookInfo || {};

  const onPolicyDelete = useCallback(() => {
    StoreActions.describeNotebook_(notebookId);
  }, [notebookId]);

  const setExecutionFile = useCallback(
    async (e) => {
      try {
        const fileName = executeFileRef.current?.input?.value;
        if (!fileName || !fileName.endsWith('.ipynb')) {
          REActions.addNotificationError('Please enter a valid notebook file name with .ipynb extension');
          return;
        }

        const result = await REClient_.promises_()._setNotebookExecuteFilename(notebookId, fileName);
        if (!result?.success) {
          REActions.addNotificationError('Error setting execution file');
        }
        StoreActions.describeNotebook_(notebookId);
      } catch (e) {
        REActions.addNotificationError('Error setting execution file');
      }
    },
    [notebookId, executeFileRef],
  );

  useEffect(() => {
    if (notebookInfo?.executeFilename) {
      setIsEditFileName(false);
    } else {
      setIsEditFileName(true);
    }
  }, [notebookInfo]);

  if (!notebookInfo?.notebookId) return null;

  return (
    <Modal
      width={'900px'}
      bodyStyle={{ height: 400 }}
      title="Notebook refresh schedules"
      open={isModalOpen}
      onCancel={() => setIsModalOpen(false)}
      okButtonProps={{ style: { display: 'none' } }}
      cancelButtonProps={{ type: 'primary' }}
      cancelText="Close"
      className="notebook-cron-modal"
    >
      <div className={styles.bodyContainer}>
        <NanoScroller onlyVertical>
          <div>
            <span className={styles.availableTxt}>Execution file:</span>
            {isEditFileName ? (
              <div className={classNames(styles.cronItem)}>
                <Input ref={executeFileRef} defaultValue={notebookInfo?.executeFilename} placeholder="Enter file name to execute" />
                <Button ghost size="small" type="primary" onClick={setExecutionFile} className={sd.detailbuttonblueBorder}>
                  Set
                </Button>
                <Button ghost size="small" onClick={() => setIsEditFileName(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className={classNames(styles.cronItem)}>
                <span>{notebookInfo?.executeFilename}</span>
                <TooltipExt title="Edit">
                  <FontAwesomeIcon className={styles.edit} onClick={() => setIsEditFileName(true)} icon={require('@fortawesome/pro-regular-svg-icons/faPenToSquare').faPenToSquare} transform={{ size: 14, x: 5, y: 0 }} />
                </TooltipExt>
              </div>
            )}
          </div>
          <span className={styles.availableTxt}>Available crons:</span>
          {refreshSchedules?.length ? (
            <div>
              {refreshSchedules.map((schedule, index) => {
                return (
                  <div key={'cron_' + index} className={styles.cronItem}>
                    <CronOne
                      projectId={paramsProp?.get('projectId')}
                      notebookId={notebookId}
                      onDeleteDone={onPolicyDelete}
                      refreshPolicyId={schedule.refreshPolicyId}
                      cron={schedule?.cron}
                      error={schedule?.error}
                      nextRun={schedule?.nextRunTime}
                      refreshType={schedule?.refreshType}
                      isProd={schedule?.isProd}
                      noMargin={true}
                      hideRun={true}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <></>
          )}
          <div className={styles.newCron}>
            <CronOne isNew notebookId={notebookInfo?.notebookId} noMargin />
          </div>
        </NanoScroller>
      </div>
    </Modal>
  );
};
export default React.memo(NotebookRefreshPolicy);
