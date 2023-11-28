import { Notebook } from '@jupyterlab/notebook';
import { Cell, CodeCell, MarkdownCell } from '@jupyterlab/cells';
import ReactDOM from 'react-dom';
import React, { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import PythonFunctionRegisterTemplate from '../FastNotebookCellTempaltes/PythonFunctionRegisterTemplate/PythonFunctionRegisterTemplate';
import PythonFunctionFeatureGroupRegisterTemplate from '../FastNotebookCellTempaltes/PythonFunctionFeatureGroupRegisterTemplate/PythonFunctionFeatureGroupRegisterTemplate';
import { ECellTemplates } from './templateUtils';
import { CELL_TEMPLATE_CONTAINER, COLLAPSE_BUTTON_CLASS, HEADLESS_CELL_TEMPLATE_CONTAINER, getCellIndexById } from '../NBEditor/FastNotebookUtils';
import styles from './FastNotebookCellTemplateRenderer.module.css';

interface FastNotebookCellTemplateRendererProps {
  notebook: Notebook;
  executeCell: (cellIndex: number) => void;
  headlessMode?: boolean;
}

const FastNotebookCellTemplateRenderer = (props: PropsWithChildren<FastNotebookCellTemplateRendererProps>) => {
  const { notebook, executeCell, headlessMode } = props;
  const [customControls, setCustomControls] = useState([]); // Stores custom controls for each cell
  const getTemplate = (template: any, cell: Cell, notebook: Notebook) => {
    const cellIndex = getCellIndexById(notebook, cell.model.id);

    switch (template?.id) {
      case ECellTemplates.REGISTER_PYTHON_FUNCTION:
        return <PythonFunctionRegisterTemplate cell={cell} cellIndex={cellIndex} executeCell={executeCell} />;
      case ECellTemplates.REGISTER_PYTHON_FUNCTION_FEATURE_GROUP:
        return <PythonFunctionFeatureGroupRegisterTemplate cell={cell} cellIndex={cellIndex} executeCell={executeCell} />;
    }
  };

  const getCustomControls = (notebook: Notebook) => {
    const customTemplates = [];

    notebook?.widgets?.forEach((cell) => {
      const cellHasTemplate = cell.model.metadata.get('cellTemplate');
      const isCollapsed = cell.model.metadata.get('jp-MarkdownHeadingCollapsed');

      if (isCollapsed && cell instanceof MarkdownCell) {
        cell.toggleCollapsedSignal.emit(true);
      }
      const templateAlreadyAdded = customTemplates.find((template) => template.cellId === cell.model.id);
      if (!templateAlreadyAdded && cellHasTemplate && cell instanceof CodeCell) {
        const customControlContainer = document.createElement('div');
        customControlContainer.id = cell.model.id;
        customControlContainer.classList.add(CELL_TEMPLATE_CONTAINER);
        cell.node.insertAdjacentElement('afterbegin', customControlContainer);
        customTemplates.push({
          cellId: cell.model.id,
          component: getTemplate(cell.model.metadata.get('cellTemplate'), cell, notebook),
        });
      }
    });

    setCustomControls(customTemplates);
  };

  useEffect(() => {
    if (!notebook) return;
    getCustomControls(notebook);
  }, [notebook]);

  return <div className={styles.container}>{customControls?.map(({ component, cellId }) => ReactDOM.createPortal(component, document.getElementById(cellId)))}</div>;
};

export default React.memo(FastNotebookCellTemplateRenderer);
