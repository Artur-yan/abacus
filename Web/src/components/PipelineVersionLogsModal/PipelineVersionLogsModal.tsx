import Modal from 'antd/lib/modal';
import _ from 'lodash';
import React, { PropsWithChildren, useState, useEffect } from 'react';
import REClient_ from '../../api/REClient';
import styles from './PipelineVersionLogsModal.module.css';
import ShowMore from '../ShowMore/ShowMore';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';

interface PipelineVersionLogsModalProps {
  isModalOpen: boolean;
  onOk: () => void;
  pipelineVersion: string;
  pipelineName: string;
}

const PipelineVersionLogsModal = ({ isModalOpen, onOk, pipelineVersion, pipelineName }: PropsWithChildren<PipelineVersionLogsModalProps>) => {
  const [stepLogs, setStepLogs] = useState([]);
  const [isFetchingLogs, setIsFetchingLogs] = useState(false);

  const getLogs = () => {
    setIsFetchingLogs(true);
    REClient_.promisesV2()
      .listPipelineVersionLogs(pipelineVersion)
      .then((response) => {
        setStepLogs(response?.result?.stepLogs);
      })
      .finally(() => {
        setIsFetchingLogs(false);
      });
  };

  const handleOk = () => {
    setStepLogs([]);
    onOk?.();
  };

  useEffect(() => {
    if (!pipelineVersion) return;
    getLogs();
  }, [pipelineVersion]);

  return (
    <Modal
      width="80vw"
      bodyStyle={{ height: '70vh' }}
      title={`Logs for Pipeline: ${pipelineName}, Version: ${pipelineVersion}`}
      open={isModalOpen}
      onOk={handleOk}
      cancelButtonProps={{ style: { display: 'none' } }}
      okText="Close"
      closable={false}
    >
      <div className={styles.bodyContainer}>
        <RefreshAndProgress refreshingPaddingTop={360} isRefreshing={isFetchingLogs}>
          <div className={styles.logsContainer}>
            {stepLogs?.map?.((stepLog, index) => (
              <pre className={styles.log} key={index}>
                <ShowMore max={400} value={stepLog?.logs} />
              </pre>
            ))}
          </div>
        </RefreshAndProgress>
      </div>
    </Modal>
  );
};
export default React.memo(PipelineVersionLogsModal);
