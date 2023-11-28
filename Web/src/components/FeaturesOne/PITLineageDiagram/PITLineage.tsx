import React, { useEffect, useMemo, useRef, useState } from 'react';
import Diagram, { AutoLayout, CustomShape, Edges, Nodes } from 'devextreme-react/diagram';
import HelpIcon from '../../HelpIcon/HelpIcon';
import TooltipExt from '../../TooltipExt/TooltipExt';
import ArrayStore from 'devextreme/data/array_store';
const styles = require('./PITLineageDiagram.module.css');

const CONSTANTS = {
  NODE_WIDTH: 250,
  NODE_HEIGHT: 40,
  LABEL_WIDTH: 150,
  SPACE_BW_TABLES: 100,
  LEFT_SPACE: 90,
};

const PITLineage = ({ height, width, chartInfo = { nodes: [], edges: [] } }) => {
  const [chart, setChart] = useState(false);
  if (!chartInfo.nodes.length || !chartInfo.edges.length) return <span>No data to show</span>;

  const selectedConnectors = useRef([]);
  const selectedShapeKeys = useRef([]);
  const chartData = useMemo(
    () => ({
      nodes: new ArrayStore({
        key: 'id',
        data: chartInfo.nodes,
      }),
      edges: new ArrayStore({
        key: 'id',
        data: chartInfo.edges,
      }),
    }),
    [chartInfo],
  );

  const customShapeTemplate = (item) => {
    if (item?.dataItem?.isLookbackNode) {
      return (
        <foreignObject x="0" y="0" width="100%" height="100%">
          <div className={styles.lookbackNodeContainer}>
            <span>{item?.dataItem?.text}</span>
          </div>
        </foreignObject>
      );
    }

    const isNodeSelected = selectedShapeKeys.current.includes(item?.key);
    const isTextNode = !!item?.dataItem?.isLabelNode;
    const isTitleNode = !!item?.dataItem?.isTitleNode;
    const nodeStyles = `${isNodeSelected ? `border: 2px solid #01ecbc !important; border-bottom: 1px solid #01ecbc !important` : ``}`;
    const textNodeStyles = `${isNodeSelected && isTextNode ? `border-top-width: 0 !important; border-bottom: 2px solid #01ecbc !important` : ``}`;

    return (
      <foreignObject x="0" y="0" width="100%" height="100%">
        {isTitleNode ? (
          <div className={styles.titleNodeContainer}>
            <span className={styles.nodeText}>{item?.dataItem?.text}</span>
            <span>
              <HelpIcon id={item?.dataItem?.helpId} style={{ marginLeft: '4px' }} />
            </span>
          </div>
        ) : (
          <div className={isTextNode ? styles.textNode : styles.nodeContainer} css={isTextNode ? textNodeStyles : nodeStyles}>
            <span className={styles.nodeText}>{item?.dataItem?.text}</span>
            {item?.dataItem?.isPartitionKey && (
              <TooltipExt title={'Partition key'}>
                <span className={styles.columnKey}>PK</span>
              </TooltipExt>
            )}
            {item?.dataItem?.isOrderingKey && (
              <TooltipExt title={'Ordering key'}>
                <span className={styles.columnKey}>OK</span>
              </TooltipExt>
            )}
          </div>
        )}
      </foreignObject>
    );
  };

  const updateDiagram = (ds, keys, reset) => {
    if (reset) {
      selectedShapeKeys.current = [];
      selectedConnectors.current = [];
    }
    for (let i = 0; i < keys.length; i++) {
      ds.push([{ type: 'update', data: {}, key: keys[i] }]);
    }
  };

  const onNodeSelection = ({ item, component }) => {
    const selectedItem = item;

    if (selectedItem?.dataItem?.isClickableNode !== true) return;
    if (selectedShapeKeys.current?.includes(item?.key)) {
      updateDiagram(chartData.nodes, [...selectedShapeKeys.current, ...selectedConnectors.current], true);
      return;
    }
    selectedShapeKeys.current = [];
    selectedConnectors.current = [];

    const getPreviousNodes = (key) => {
      if (!key) return;

      const previousNodes = component.getItems()?.filter((item) => item?.toKey === key);
      previousNodes?.forEach((node) => {
        selectedConnectors.current.push(node?.key);
        selectedShapeKeys.current.push(node?.fromKey);
        getPreviousNodes(node?.fromKey);
      });
    };
    const getNextNodes = (key) => {
      if (!key) return;

      const nextNodes = component.getItems().filter((item) => item.fromKey === key);
      nextNodes?.forEach((node) => {
        selectedConnectors.current.push(node?.key);
        selectedShapeKeys.current.push(node.toKey);
        getNextNodes(node?.toKey);
      });
    };

    if (selectedItem?.key) selectedShapeKeys.current?.push(selectedItem?.key);
    selectedItem?.attachedConnectorIds?.forEach((connectorId) => {
      const item = component.getItemById(connectorId);
      selectedConnectors.current?.push(item.key);

      if (item?.fromKey === selectedItem?.key) {
        selectedShapeKeys.current.push(item?.toKey);
        getNextNodes(item.toKey);
      }
      if (item?.toKey === selectedItem?.key) {
        selectedShapeKeys.current.push(item?.fromKey);
        getPreviousNodes(item.fromKey);
      }
    });

    updateDiagram(chartData.nodes, [...selectedShapeKeys.current, ...selectedConnectors.current], false);
  };

  const edgeStyleExpr = (item) => ({
    stroke: selectedConnectors.current?.includes(item?.id) ? '#01ecbc' : '#b2c9da',
    'stroke-width': selectedConnectors.current?.includes(item?.id) ? 2 : 1.3,
    ...(item?.dotted && { 'stroke-dasharray': '3 3' }),
  });

  const nodeStyleExpr = (item) => ({
    fill: item?.isLabelNode ? '#ff000000' : '#19232f',
    'stroke-width': 0,
  });

  const edgeLineExpr = (item) => (item?.toLabelNode ? 'none' : 'filledTriangle');

  const edgeZindexExpr = (item) => (selectedConnectors.current?.includes(item?.id) ? '9999' : undefined);

  useEffect(() => {
    setTimeout(() => setChart(true), 100);
  }, []);

  return !chart ? (
    <p>Loading...</p>
  ) : (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0">
        <defs>
          <linearGradient id="lgrad-p" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="1%" stop-color="rgb(45,19,93)" stop-opacity="0.00" />
            <stop offset="47%" stop-color="rgb(25,84,233)" stop-opacity="0.45" />
            <stop offset="99%" stop-color="rgb(18,139,148)" stop-opacity="1.00" />
          </linearGradient>
        </defs>
      </svg>
      <Diagram units="px" elementAttr={{ class: 'diagram' }} showGrid={false} readOnly={true} height={height} width={width - 50} customShapeRender={customShapeTemplate} onItemClick={onNodeSelection}>
        <CustomShape type="my-container" baseType="rectangle" defaultWidth={CONSTANTS.NODE_WIDTH} defaultHeight={CONSTANTS.NODE_HEIGHT} />
        <Nodes
          dataSource={chartData?.nodes}
          keyExpr="key"
          textExpr="text"
          leftExpr="x"
          topExpr="y"
          heightExpr="height"
          widthExpr="width"
          styleExpr={nodeStyleExpr}
          textStyleExpr={() => ({ opacity: 0 })}
          typeExpr={() => 'my-container'}
        ></Nodes>
        <Edges
          dataSource={chartData?.edges}
          keyExpr="key"
          textExpr="text"
          fromExpr="fromId"
          toExpr="toId"
          toLineEndExpr={edgeLineExpr}
          styleExpr={edgeStyleExpr}
          zIndexExpr={edgeZindexExpr}
          fromPointIndexExpr={() => '1'}
          toPointIndexExpr={() => '3'}
        />
      </Diagram>
    </>
  );
};

export default PITLineage;
