import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import Diagram, { AutoLayout, CustomShape, Edges, Nodes } from 'devextreme-react/diagram';
import ArrayStore from 'devextreme/data/array_store';
import React, { PropsWithChildren, useMemo, useRef } from 'react';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import ModalContent from '../ModalContent/ModalContent';
import { IconFeatureGroups } from '../NavLeft/utils';
import TooltipExt from '../TooltipExt/TooltipExt';

const styles = require('./PipelineDagModal.module.css');
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
  const name = param?.name;
  const variableType = param?.variable_type;
  const version = param?.version;
  const pipelineVar = param?.pipeline_variable;

  if (version != null) {
    value = `${name}: ${variableType} = ${value ?? '<None>'} - Version ${version}`;
  } else if (pipelineVar != null && value != null) {
    value = `${name}: ${variableType} = ${value} - Pipeline Variable ${pipelineVar}`;
  } else if (pipelineVar != null) {
    value = `${name}: ${variableType} = Pipeline Variable ${pipelineVar}`;
  } else {
    value = `${name}: ${variableType} = ${value ?? `<NOT SET>`}`;
  }
  return value;
};

const getOutputParamText = (param) => {
  let value = param?.value;
  const name = param?.name;
  const variableType = param?.variable_type;
  const version = param?.version;

  if (version != null) {
    value = `${name}: ${variableType} = ${value ?? '<None>'} - Version ${version}`;
  } else if (value != null) {
    value = `${name}: ${variableType} = ${value}`;
  } else {
    value = `${name}: ${variableType}`;
  }
  return value;
};

const NodeTemplate = React.memo(({ data, selectedShapeKeys }: PropsWithChildren<NodeTemplateProps>) => {
  const { stepName, stepId, functionInputMappings, stepOutputMappings } = data?.dataItem || {};

  const isNodeSelected = selectedShapeKeys.includes(data?.key);

  const nodeStyles = {
    opacity: isNodeSelected || !selectedShapeKeys?.length ? 1 : 0.4,
    ...(isNodeSelected && { border: `1px solid ${NodeTypeColors.selected_node}` }),
    borderLeft: `5px solid ${isNodeSelected ? NodeTypeColors.selected_node : NodeTypeColors.default}`,
  };

  const title = (
    <div className={styles.tooltipTitle}>
      <span className={styles.fgIdTxt}>{`Step: ${stepName}`}</span>
      <span className={styles.paramsTitle}>Step Input Mappings: </span>
      <div className={styles.paramsContainer}>
        {functionInputMappings?.map?.((function_variable, index) => {
          return (
            <div key={`param-${stepId}-${index}`} className={classNames(styles.paramRow, styles.dateCreatedTxt)}>
              {getParamText(function_variable)}
            </div>
          );
        })}
      </div>
      {stepOutputMappings?.length > 0 ? (
        <>
          <span className={styles.paramsTitle}>Step Output Mappings: </span>
          <div className={styles.paramsContainer}>
            {stepOutputMappings?.map?.((function_variable, index) => {
              return (
                <div key={`output-param-${stepId}-${index}`} className={classNames(styles.paramRow, styles.dateCreatedTxt)}>
                  {getOutputParamText(function_variable)}
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
  return (
    <TooltipExt autoAdjustOverflow className={styles.tooltip} title={title}>
      <div className={styles.nodeContainer} css={nodeStyles}>
        <div className={styles.leftContainer}>
          <p className={styles.textContainer}>
            <FontAwesomeIcon color="#1990ff" style={{ fill: '#1990ff', paddingRight: 4 }} icon={IconFeatureGroups} transform={{ size: 16, x: -1, y: 0 }} />
            <span className={styles.fgIdTxt}>{getTruncatedText(stepName)}</span>
          </p>
        </div>
      </div>
    </TooltipExt>
  );
});

interface PipelineDagProps {
  nodes: any[];
  connections: any[];
  pipelineName: string;
}

const PipelineDag = React.memo(({ nodes, connections, pipelineName }: PropsWithChildren<PipelineDagProps>) => {
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
      <p className={styles.fgTitle}>{`Pipeline : ${pipelineName}`}</p>
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

interface PipelineDagModalProps {
  pipelineId: string;
  pipelineVersion: string;
  modalName?: string;
}

const PipelineDagModal = React.memo(({ pipelineId, pipelineVersion, modalName }: PipelineDagModalProps) => {
  const [pipeline, setPipeline] = React.useState(null as any);
  const [nodes, setNodes] = React.useState([]);
  const [connections, setConnections] = React.useState([]);

  const onShow = async () => {
    if (!pipelineId) return;
    try {
      const response = await REClient_.promises_().describePipeline(pipelineId);
      if (response?.error || !response?.success) throw new Error(response?.error);
      setPipeline(response?.result);
    } catch (error) {
      REActions.addNotificationError(error?.message || Constants.errorDefault);
    }
  };

  React.useEffect(() => {
    if (!pipeline || nodes.length) return;

    const newConnections =
      pipeline?.steps
        ?.map?.((step) => {
          return (
            step?.stepDependencies?.map((predecessor) => ({
              from: predecessor,
              to: step?.stepName,
              id: `${predecessor}_${step?.stepName}`,
              dotted: false,
            })) || []
          );
        })
        ?.flat() || [];

    const newNodes =
      pipeline?.steps?.map?.((step) => ({
        stepName: step?.stepName,
        stepId: step?.pipelineStepId,
        functionInputMappings: step?.pythonFunction?.functionVariableMappings,
        stepOutputMappings: step?.pythonFunction?.outputVariableMappings,
        id: step?.stepName,
      })) || [];
    setNodes(newNodes);
    setConnections(newConnections);
  }, [pipeline]);

  const content = (
    <div style={{ height: Heights.diagramContainer }}>
      <PipelineDag nodes={nodes} connections={connections} pipelineName={pipeline?.pipelineName} />
    </div>
  );

  // NOTE: this is a hack for solving a positioning issue in Diagram's viewToolbar when reopening a blueprint
  const cleanup = () => {
    setNodes([]);
    setConnections([]);
    setPipeline(null);
  };

  return (
    <ModalContent onShow={onShow} onCancel={cleanup} onConfirm={cleanup} content={content} width="90vw" bodyStyle={{ minWidth: '1000px' }} cancelText="Close" okButtonProps={{ style: { display: 'none' } }}>
      <span className={stylesDark.linkBlue}>{modalName ?? 'Pipeline Graph'}</span>
    </ModalContent>
  );
});

export default PipelineDagModal;
