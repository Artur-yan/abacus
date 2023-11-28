import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import Diagram, { AutoLayout, CustomShape, Edges, Nodes } from 'devextreme-react/diagram';
import ArrayStore from 'devextreme/data/array_store';
import React, { PropsWithChildren, useMemo, useRef } from 'react';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import ModalContent from '../ModalContent/ModalContent';
import { IconModelBlueprintStage } from '../NavLeft/utils';
import TooltipExt from '../TooltipExt/TooltipExt';

const styles = require('./ModelBlueprintModal.module.css');
const stylesDark = require('../antdUseDark.module.css');

interface NodeTemplateProps {
  data: any;
  selectedShapeKeys: any;
}

const NodeTypeColors = {
  default: '#535e68',
  selected_node: '#ec8c22',
};

const Heights = {
  diagramContainer: 640,
  diagram: 600,
};

const getTruncatedText = (text: string, maxChars: number = 40) => {
  return text.length > maxChars ? `${text.substring(0, maxChars)}...` : text;
};

// EXAMPLE_KEY => Example Key
const keyToText = (str) =>
  str
    .split('_')
    .map((word) =>
      word
        .split('')
        .map((char, i) => (i ? char.toLowerCase() : char.toUpperCase()))
        .join(''),
    )
    .join(' ');

const getParamText = (param) => {
  let value = param?.value;
  const name = keyToText(param?.name || '');

  switch (typeof value) {
    case 'number':
      value = `${name}'s value was ${value}`;
      break;
    case 'boolean':
      value = `${name}'s value was set to ${value}`;
      break;
    case 'string':
    default:
      value = `${name}: ${value ?? '<None>'}`;
  }
  return value;
};

const NodeTemplate = React.memo(({ data, selectedShapeKeys }: PropsWithChildren<NodeTemplateProps>) => {
  const { description, displayName, params, id, stageName } = data?.dataItem || {};

  const isNodeSelected = selectedShapeKeys.includes(data?.key);

  const nodeStyles = {
    opacity: isNodeSelected || !selectedShapeKeys?.length ? 1 : 0.4,
    ...(isNodeSelected && { border: `1px solid ${NodeTypeColors.selected_node}` }),
    borderLeft: `5px solid ${isNodeSelected ? NodeTypeColors.selected_node : NodeTypeColors.default}`,
  };

  const title = (
    <div className={styles.tooltipTitle}>
      <span className={styles.fgIdTxt}>{`Stage: ${displayName}`}</span>
      <span className={styles.paramsTitle}>Stage Parameters: </span>
      <div className={styles.paramsContainer}>
        {params?.map?.((param, index) => {
          return (
            <div key={`param-${id}-${index}`} className={classNames(styles.paramRow, styles.dateCreatedTxt)}>
              {getParamText(param)}
            </div>
          );
        })}
      </div>
    </div>
  );
  return (
    <TooltipExt autoAdjustOverflow className={styles.tooltip} title={title}>
      <div className={styles.nodeContainer} css={nodeStyles}>
        <div className={styles.leftContainer}>
          <p className={styles.textContainer}>
            <FontAwesomeIcon className={styles.modelStageIcon} icon={IconModelBlueprintStage} transform={{ size: 16 }} />
            <span className={styles.fgIdTxt}>{getTruncatedText(displayName)}</span>
          </p>
          <p className={styles.dateCreatedTxt}>{description}</p>
        </div>
      </div>
    </TooltipExt>
  );
});

interface BlueprintDiagramProps {
  nodes: any[];
  connections: any[];
  algorithmName: string;
}

const BlueprintDiagram = React.memo(({ nodes, connections, algorithmName }: PropsWithChildren<BlueprintDiagramProps>) => {
  if (!nodes?.length) return <></>;

  const refDiagram = useRef(null);
  const selectedShapeKeys = useRef([]);
  const selectedConnectors = useRef([]);

  const nodeSource = useMemo(() => new ArrayStore({ key: 'id', data: nodes }), [nodes]);

  const connectorSource = useMemo(() => new ArrayStore({ key: 'id', data: connections }), [connections]);

  const customShapeTemplate = (item) => {
    return (
      <foreignObject x="0" y="0" width="100%" height="100%" fill="red">
        <NodeTemplate data={item} selectedShapeKeys={selectedShapeKeys.current} />
      </foreignObject>
    );
  };

  const edgeStyleExpr = (item) => ({
    stroke: '#b2c9da',
    fill: '#b2c9da',
    opacity: selectedConnectors.current?.includes(item?.id) || !selectedConnectors.current?.length ? 1 : 0.4,
    'stroke-width': 1.7,
    ...(item?.dotted && { 'stroke-dasharray': '3 3' }),
  });

  const nodeStyleExpr = (item) => ({
    fill: '#253341',
    opacity: selectedShapeKeys.current?.includes(item?.id) || !selectedShapeKeys.current?.length ? 1 : 0.4,
  });

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
    if (selectedShapeKeys.current?.includes(item?.key)) {
      updateDiagram(nodeSource, [...selectedShapeKeys.current, ...selectedConnectors.current], true);
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

    updateDiagram(nodeSource, [...selectedShapeKeys.current, ...selectedConnectors.current], false);
  };

  React.useEffect(() => {
    refDiagram.current.instance.fitToWidth();
  }, [nodes]);

  return (
    <div>
      <p className={styles.fgTitle}>{`Blueprint: ${algorithmName}`}</p>
      <Diagram ref={refDiagram} units="px" elementAttr={{ class: 'diagram' }} showGrid={false} readOnly height={Heights.diagram} customShapeRender={customShapeTemplate} onItemClick={onNodeSelection}>
        <CustomShape type="fg_nodes" baseType="rectangle" defaultWidth={250} defaultHeight={110} />
        <Nodes dataSource={nodeSource} keyExpr="id" typeExpr={() => 'fg_nodes'} styleExpr={nodeStyleExpr}>
          <AutoLayout type="tree" orientation="horizontal" />
        </Nodes>
        <Edges dataSource={connectorSource} keyExpr="id" textExpr="text" fromExpr="from" toExpr="to" toLineEndExpr={() => 'outlinedTriangle'} styleExpr={edgeStyleExpr} />
      </Diagram>
    </div>
  );
});

interface ModelBlueprintModalProps {
  modelVersion: string;
  algorithm: string;
  algorithmName: string;
}

const ModelBlueprintModal = React.memo(({ modelVersion, algorithm, algorithmName }: ModelBlueprintModalProps) => {
  const [blueprint, setBlueprint] = React.useState(null as any);
  const [nodes, setNodes] = React.useState([]);
  const [connections, setConnections] = React.useState([]);

  const onShow = async () => {
    if (!modelVersion) return;
    try {
      const response = await REClient_.promises_()._getModelBlueprint(modelVersion, algorithm);
      if (response?.error || !response?.success) throw new Error(response?.error);
      setBlueprint(response?.result);
    } catch (error) {
      REActions.addNotificationError(error?.message || Constants.errorDefault);
    }
  };

  React.useEffect(() => {
    if (!blueprint || nodes.length) return;

    const newConnections =
      blueprint?.modelBlueprintStages
        ?.map?.((stage) => {
          return (
            stage?.predecessors?.map((predecessor) => ({
              from: predecessor,
              to: stage?.stageName,
              id: `${predecessor}_${stage?.stageName}`,
              dotted: false,
            })) || []
          );
        })
        ?.flat() || [];

    const newNodes =
      blueprint?.modelBlueprintStages?.map?.((stage) => ({
        ...stage,
        id: stage?.stageName,
      })) || [];
    setNodes(newNodes);
    setConnections(newConnections);
  }, [blueprint]);

  const content = (
    <div style={{ height: Heights.diagramContainer }}>
      <BlueprintDiagram nodes={nodes} connections={connections} algorithmName={algorithmName} />
    </div>
  );

  // NOTE: this is a hack for solving a positioning issue in Diagram's viewToolbar when reopening a blueprint
  const cleanup = () => {
    setNodes([]);
    setConnections([]);
    setBlueprint(null);
  };

  return (
    <ModalContent onShow={onShow} onCancel={cleanup} onConfirm={cleanup} content={content} width="90vw" bodyStyle={{ minWidth: '1000px' }} cancelText="Close" okButtonProps={{ style: { display: 'none' } }}>
      <span className={stylesDark.linkBlue}>blueprint</span>
    </ModalContent>
  );
});

export default ModelBlueprintModal;
