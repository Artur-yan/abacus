import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Diagram, { AutoLayout, CustomShape, Edges, Nodes } from 'devextreme-react/diagram';
import React, { PropsWithChildren, useMemo, useRef } from 'react';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';

import ArrayStore from 'devextreme/data/array_store';
import { useSelector } from 'react-redux';
import Location from '../../../../core/Location';
import Utils from '../../../../core/Utils';
import UtilsWeb from '../../../../core/UtilsWeb';
import REActions from '../../../actions/REActions';
import DateOld from '../../DateOld/DateOld';
import HelpIcon from '../../HelpIcon/HelpIcon';
import { IconDatasets, IconFeatureGroups } from '../../NavLeft/utils';
import PartsLink from '../../NavLeft/PartsLink';
import TooltipExt from '../../TooltipExt/TooltipExt';
const styles = require('./FGLineageDiagram.module.css');

interface IFGNodeTemplateProps {
  data: any;
  selectedShapeKeys: any;
  projectId: any;
}

const NODE_TYPE_COLORS = {
  DEFAULT: '#535e68',
  PYTHON_FG: '#8c54ff',
  SQL_FG: '#2e5bff',
  DATASET: '#38BFA1',
  SELECTED_NODE: '#ec8c22',
};

const CONSTANTS = {
  FG_TITLE: 'Feature Group Lineage',
  FG_TITLE_HEIGHT: 36,
  COPT_TABLE_NAME_SUCCESS: 'Table name copied to clipboard!',
  TOOLTIP: {
    COPY_TABLE_NAME: 'Copy Table Name',
    SQL_FG: 'SQL Feature Group',
    PYTHON_FG: 'Python Feature Group',
    DATASET: 'Dataset',
    FG: 'Feature Group',
    OPEN_FG_DETAIL: 'Open Feature Group Details',
  },
};

const FGNodeTemplate = React.memo((props: PropsWithChildren<IFGNodeTemplateProps>) => {
  const { paramsProp } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
  }));
  const { createdAt, featureGroupId, featureGroupType, datasetId, isFeatureGroup, tableName, featureGroupTemplateName, isInProject } = props?.data?.dataItem || {};
  const selectedShapeKeys = props?.selectedShapeKeys;
  const isNodeSelected = selectedShapeKeys.includes(props?.data?.key);

  const getBorderByFGType = () => {
    const type = !isFeatureGroup ? 'non_fg_dataset' : featureGroupType;
    let config = { color: '', tooltip: undefined };

    switch (type) {
      case 'sql':
        config.tooltip = CONSTANTS.TOOLTIP.SQL_FG;
        config.color = NODE_TYPE_COLORS.SQL_FG;
        break;
      case 'python':
        config.tooltip = CONSTANTS.TOOLTIP.PYTHON_FG;
        config.color = NODE_TYPE_COLORS.PYTHON_FG;
        break;
      case 'non_fg_dataset':
        config.tooltip = CONSTANTS.TOOLTIP.DATASET;
        config.color = NODE_TYPE_COLORS.DATASET;
        break;
      default:
        config.tooltip = CONSTANTS.TOOLTIP.FG;
        config.color = NODE_TYPE_COLORS.DEFAULT;
        break;
    }
    if (isNodeSelected) {
      config.color = NODE_TYPE_COLORS.SELECTED_NODE;
    }
    return config;
  };

  const onClickCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!Utils.isNullOrEmpty(tableName)) {
      UtilsWeb.copyToClipboard(tableName);
      REActions.addNotification(CONSTANTS.COPT_TABLE_NAME_SUCCESS);
    }
  };

  const onDetailsPageClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    Location.push(`/${PartsLink.feature_group_detail}/${isInProject ? props?.projectId : '-'}/${featureGroupId}`);
  };

  const nodeStyles = `
    opacity: ${isNodeSelected || !selectedShapeKeys?.length ? 1 : 0.4};
    ${isNodeSelected ? `border: 1px solid ${NODE_TYPE_COLORS.SELECTED_NODE}` : ``};
    border-left: 5px solid ${getBorderByFGType().color};
  `;

  return (
    <div className={styles.nodeContainer} css={nodeStyles}>
      <div className={styles.leftContainer}>
        <p className={styles.textContainer}>
          <TooltipExt title={getBorderByFGType().tooltip}>
            <FontAwesomeIcon color="#1990ff" icon={isFeatureGroup ? IconFeatureGroups : IconDatasets} transform={{ size: 16, x: -1, y: 0 }} style={{ fill: '#1990ff', paddingRight: 5 }} />
          </TooltipExt>
          <span className={styles.fgIdTxt}>
            <TooltipExt title={tableName?.length > 40 ? tableName : undefined}>{tableName?.length > 40 ? `${tableName?.substring(0, 40)}...` : tableName}</TooltipExt>
            <TooltipExt title={CONSTANTS.TOOLTIP.COPY_TABLE_NAME}>
              <FontAwesomeIcon className={styles.copyIcon} onClick={onClickCopy} icon={['fad', 'clipboard']} transform={{ size: 15, x: 5, y: 0 }} />
            </TooltipExt>
          </span>
        </p>
        <p>
          <p className={styles.fgTableTxt}>{isFeatureGroup ? featureGroupId : datasetId}</p>
          <p className={styles.dateCreatedTxt}>
            <DateOld date={createdAt} />
          </p>
        </p>
      </div>
      <div className={styles.rightContainer}>
        {isFeatureGroup && (
          <TooltipExt title={CONSTANTS.TOOLTIP.OPEN_FG_DETAIL}>
            <FontAwesomeIcon
              onClick={onDetailsPageClick}
              className={styles.editIcon}
              color="#1990ff"
              icon={require('@fortawesome/pro-regular-svg-icons/faSquareArrowUpRight').faSquareArrowUpRight}
              transform={{ size: 16, x: -1, y: 0 }}
              style={{ fill: '#1990ff' }}
            />
          </TooltipExt>
        )}
        {featureGroupType === 'template' && (
          <TooltipExt title={featureGroupTemplateName || 'Template'}>
            <p className={styles.templateFgIcon}>T</p>
          </TooltipExt>
        )}
        {featureGroupType === 'sql' && (
          <FontAwesomeIcon
            onClick={() => Location.push(`/${PartsLink.feature_groups_edit}/${isInProject ? props?.projectId : '-'}/${featureGroupId}`)}
            className={styles.editIcon}
            color="#1990ff"
            icon={require('@fortawesome/pro-regular-svg-icons/faPenToSquare').faPenToSquare}
            transform={{ size: 16, x: -1, y: 0 }}
            style={{ fill: '#1990ff' }}
          />
        )}
      </div>
    </div>
  );
});

const FGLineageDiagram = ({ featuresGroupLineageData, projectId }) => {
  if (!featuresGroupLineageData) return <></>;
  const refDiagram = useRef(null);
  const selectedShapeKeys = useRef([]);
  const selectedConnectors = useRef([]);

  const nodeSource = useMemo(
    () =>
      new ArrayStore({
        key: 'id',
        data: featuresGroupLineageData?.nodes,
      }),
    [featuresGroupLineageData],
  );

  const connectorSource = useMemo(
    () =>
      new ArrayStore({
        key: 'id',
        data: featuresGroupLineageData?.connections,
      }),
    [featuresGroupLineageData],
  );

  const customShapeTemplate = (item) => {
    return (
      <foreignObject x="0" y="0" width="100%" height="100%" fill="red">
        <FGNodeTemplate data={item} selectedShapeKeys={selectedShapeKeys.current} projectId={projectId} />
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

  return (
    <div
      css={`
        position: absolute;
        top: 0;
        left: 0;
        right: 10px;
        bottom: 0;
        border-radius: 4px;
        border: none;
      `}
    >
      <AutoSizer disableWidth>
        {({ height }) => {
          return (
            <div>
              <p className={styles.fgTitle}>
                {CONSTANTS.FG_TITLE}
                <HelpIcon id={'featuregroups_lineage'} style={{ marginLeft: '4px' }} />
              </p>
              <Diagram ref={refDiagram} units="px" elementAttr={{ class: 'diagram' }} showGrid={false} readOnly={true} height={height - CONSTANTS.FG_TITLE_HEIGHT} customShapeRender={customShapeTemplate} onItemClick={onNodeSelection}>
                <CustomShape type="fg_nodes" baseType="rectangle" defaultWidth={250} defaultHeight={110} />
                <Nodes dataSource={nodeSource} keyExpr="id" typeExpr={() => 'fg_nodes'} styleExpr={nodeStyleExpr}>
                  <AutoLayout type="tree" orientation="horizontal" />
                </Nodes>
                <Edges dataSource={connectorSource} keyExpr="id" textExpr="text" fromExpr="from" toExpr="to" toLineEndExpr={() => 'outlinedTriangle'} styleExpr={edgeStyleExpr} />
              </Diagram>
            </div>
          );
        }}
      </AutoSizer>
    </div>
  );
};

export default FGLineageDiagram;
