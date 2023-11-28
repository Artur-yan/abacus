import React, { useMemo } from 'react';
import Modal from 'antd/lib/modal/Modal';
const styles = require('./PITLineageDiagram.module.css');
import PITLineage from './PITLineage';

const CONSTANTS = {
  NODE_WIDTH: 220,
  NODE_HEIGHT: 40,
  LABEL_WIDTH: 150,
  SPACE_BW_TABLES: 90,
  LEFT_SPACE: 90,
  LOOKBACK_NODE_HEIGHT: 20,
};
const PITLineageDiagram = ({ selectedPITgroup = '', pitData, onClose = () => {} }) => {
  if (!selectedPITgroup) return <></>;

  const chartData = useMemo(() => {
    const leftTable = [],
      rightTable = [],
      labelTable = [],
      edgesTable = [],
      missingAggregationKeys = [],
      uniqueLeftTableColumns = {},
      allowedRightTableColumns = {};
    const aggrigationKeys = (pitData?.aggregationKeys || []).reduce((a, v) => ({ ...a, [v]: false }), {});
    let lookbackNodes = 0,
      leftStaticContentHeight = 0,
      isOrderingKeyMissing = true;
    if (pitData?.features) {
      pitData?.features?.forEach((feature) => {
        const columnName = feature?.pitOperationConfig?.columnName;
        if (aggrigationKeys[columnName] === false) {
          aggrigationKeys[columnName] = true;
        }
        if (columnName === pitData?.windowKey) {
          isOrderingKeyMissing = false;
        }
      });
      leftTable.push({
        key: `l-title`,
        id: `l-title`,
        text: 'PIT Group Specification',
        x: CONSTANTS.LEFT_SPACE,
        y: CONSTANTS.NODE_HEIGHT,
        width: CONSTANTS.NODE_WIDTH,
        height: CONSTANTS.NODE_HEIGHT,
        isTitleNode: true,
        helpId: 'pit_group_specification',
      });
      if (pitData?.lookbackCount) {
        leftTable.push({
          key: `l-lookback-count`,
          id: `l-lookback-count`,
          text: `Lookback count - ${pitData?.lookbackCount}`,
          x: CONSTANTS.LEFT_SPACE,
          y: CONSTANTS.NODE_HEIGHT * 2 + (lookbackNodes < 1 ? 0 : CONSTANTS.LOOKBACK_NODE_HEIGHT * lookbackNodes),
          width: CONSTANTS.NODE_WIDTH,
          height: CONSTANTS.LOOKBACK_NODE_HEIGHT,
          isLookbackNode: true,
        });
        lookbackNodes++;
      }
      if (pitData?.lookbackWindow) {
        leftTable.push({
          key: `l-lookback-window`,
          id: `l-lookback-window`,
          text: `Lookback window - ${pitData?.lookbackWindow}secs`,
          x: CONSTANTS.LEFT_SPACE,
          y: CONSTANTS.NODE_HEIGHT * 2 + (lookbackNodes < 1 ? 0 : CONSTANTS.LOOKBACK_NODE_HEIGHT * lookbackNodes),
          width: CONSTANTS.NODE_WIDTH,
          height: CONSTANTS.LOOKBACK_NODE_HEIGHT,
          isLookbackNode: true,
        });
        lookbackNodes++;
      }
      if (pitData?.lookbackWindowLag) {
        leftTable.push({
          key: `l-lookback-window-lag`,
          id: `l-lookback-window-lag`,
          text: `Lookback window lag - ${pitData?.lookbackWindowLag}`,
          x: CONSTANTS.LEFT_SPACE,
          y: CONSTANTS.NODE_HEIGHT * 2 + (lookbackNodes < 1 ? 0 : CONSTANTS.LOOKBACK_NODE_HEIGHT * lookbackNodes),
          width: CONSTANTS.NODE_WIDTH,
          height: CONSTANTS.LOOKBACK_NODE_HEIGHT,
          isLookbackNode: true,
        });
        lookbackNodes++;
      }
      leftStaticContentHeight = CONSTANTS.NODE_HEIGHT * 2 + CONSTANTS.LOOKBACK_NODE_HEIGHT * lookbackNodes;
      Object.keys(aggrigationKeys)?.forEach((key) => {
        if (!aggrigationKeys[key]) {
          missingAggregationKeys.push({
            key: `missing-aggregation-key`,
            id: `missing-aggregation-key`,
            text: key || '',
            x: CONSTANTS.LEFT_SPACE,
            y: leftStaticContentHeight + CONSTANTS.NODE_HEIGHT * Object.keys(uniqueLeftTableColumns).length,
            width: CONSTANTS.NODE_WIDTH,
            height: CONSTANTS.NODE_HEIGHT,
            isPartitionKey: true,
          });
          leftStaticContentHeight = leftStaticContentHeight + CONSTANTS.NODE_HEIGHT;
        }
      });
      if (isOrderingKeyMissing && pitData?.windowKey) {
        missingAggregationKeys.push({
          key: `missing-ordering-key`,
          id: `missing-ordering-key`,
          text: pitData?.windowKey,
          x: CONSTANTS.LEFT_SPACE,
          y: leftStaticContentHeight + CONSTANTS.NODE_HEIGHT * Object.keys(uniqueLeftTableColumns).length,
          width: CONSTANTS.NODE_WIDTH,
          height: CONSTANTS.NODE_HEIGHT,
          isOrderingKey: true,
        });
        leftStaticContentHeight = leftStaticContentHeight + CONSTANTS.NODE_HEIGHT;
      }
      rightTable.push({
        key: `r-title`,
        id: `r-title`,
        text: 'Generated PIT Features',
        x: CONSTANTS.LEFT_SPACE + CONSTANTS.LABEL_WIDTH + CONSTANTS.NODE_WIDTH + CONSTANTS.SPACE_BW_TABLES * 2,
        y: CONSTANTS.NODE_HEIGHT,
        width: CONSTANTS.NODE_WIDTH,
        height: CONSTANTS.NODE_HEIGHT,
        isTitleNode: true,
        helpId: 'pit_generated_features',
      });

      pitData?.features?.forEach((feature, index) => {
        const leftColumnName = feature?.pitOperationConfig?.columnName;
        const isPartitionKey = aggrigationKeys[leftColumnName];
        const isOrderingKey = leftColumnName === pitData?.windowKey;
        if (leftColumnName && !uniqueLeftTableColumns[leftColumnName]) {
          leftTable.push({
            key: `l${index}`,
            id: `l${index}`,
            text: leftColumnName,
            x: CONSTANTS.LEFT_SPACE,
            y: leftStaticContentHeight + CONSTANTS.NODE_HEIGHT * Object.keys(uniqueLeftTableColumns).length,
            width: CONSTANTS.NODE_WIDTH,
            height: CONSTANTS.NODE_HEIGHT,
            isClickableNode: true,
            isPartitionKey,
            isOrderingKey,
          });
          uniqueLeftTableColumns[leftColumnName] = `l${index}`;
        }

        if (feature?.name && feature?.pitOperationType) {
          allowedRightTableColumns[feature?.name] = `r${index}`;
          labelTable.push({
            key: `t${index}`,
            id: `t${index}`,
            text: feature?.pitOperationType || '',
            x: CONSTANTS.LEFT_SPACE + CONSTANTS.NODE_WIDTH + CONSTANTS.SPACE_BW_TABLES,
            y: CONSTANTS.NODE_HEIGHT * (Object.keys(allowedRightTableColumns).length + 1),
            width: CONSTANTS.LABEL_WIDTH,
            isLabelNode: true,
            isClickableNode: true,
          });
          rightTable.push({
            key: `r${index}`,
            id: `r${index}`,
            text: feature?.name,
            x: CONSTANTS.LEFT_SPACE + CONSTANTS.LABEL_WIDTH + CONSTANTS.NODE_WIDTH + CONSTANTS.SPACE_BW_TABLES * 2,
            y: CONSTANTS.NODE_HEIGHT * (Object.keys(allowedRightTableColumns).length + 1),
            width: CONSTANTS.NODE_WIDTH,
            height: CONSTANTS.NODE_HEIGHT,
            isClickableNode: true,
          });
        }

        if (feature?.pitOperationType) {
          edgesTable.push(
            {
              fromId: uniqueLeftTableColumns[leftColumnName] || `l${index}`,
              id: `e1${index}`,
              toLabelNode: true,
              toId: `t${index}`,
              key: `e1${index}`,
            },
            {
              fromId: `t${index}`,
              id: `e2${index}`,
              toId: `r${index}`,
              key: `e2${index}`,
            },
          );
        }
      });
    }
    return {
      nodes: [...leftTable, ...missingAggregationKeys, ...rightTable, ...labelTable],
      edges: edgesTable,
    };
  }, [pitData]);

  return (
    <div>
      <Modal title={null} open={!!selectedPITgroup} width={1000} onOk={onClose} closable={false} cancelButtonProps={{ hidden: true }} className="pit-modal">
        <>
          <div className={styles.header}>
            <p>PIT Lineage</p>
          </div>
          <div className={styles.chartContainer}>
            <PITLineage height={500} width={1000} chartInfo={chartData} />
          </div>
        </>
      </Modal>
    </div>
  );
};

export default PITLineageDiagram;
