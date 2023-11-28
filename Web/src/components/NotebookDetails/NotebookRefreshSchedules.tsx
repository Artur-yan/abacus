import React from 'react';
import CronOne from '../CronOne/CronOne';
const styles = require('./NotebookDetails.module.css');

const NotebookRefreshSchedules = ({ refreshSchedules, projectId, notebookId, onPolicyDelete }) => {
  return (
    <div>
      {refreshSchedules?.length ? (
        <div>
          {refreshSchedules.map((schedule) => {
            return (
              <div key={schedule?.refreshPolicyId} className={styles.cronItem}>
                <CronOne
                  projectId={projectId}
                  notebookId={notebookId}
                  onDeleteDone={onPolicyDelete}
                  refreshPolicyId={schedule?.refreshPolicyId}
                  cron={schedule?.cron}
                  error={schedule?.error}
                  nextRun={schedule?.nextRunTime}
                  refreshType={schedule?.refreshType}
                  isProd={schedule?.isProd}
                  hideRun={true}
                  hidePause={true}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <></>
      )}
      <div className={styles.newCron}>
        <CronOne isNew notebookId={notebookId} noMargin />
      </div>
    </div>
  );
};

export default React.memo(NotebookRefreshSchedules);
