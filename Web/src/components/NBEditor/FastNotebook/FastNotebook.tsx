import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Cell, CodeCell, CodeCellModel, MarkdownCell, MarkdownCellModel } from '@jupyterlab/cells';
import { faCirclePlay, faNotebook, faArrowUp, faArrowDown, faPlusLarge, faTrash } from '@fortawesome/pro-solid-svg-icons';
import { Notebook, NotebookActions } from '@jupyterlab/notebook';
import confirm from 'antd/lib/modal/confirm';
import * as _ from 'lodash';
import React, { MutableRefObject, PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as uuid from 'uuid';
import REActions from '../../../actions/REActions';
import REClient_ from '../../../api/REClient';
import Constants from '../../../constants/Constants';
import NanoScroller from '../../NanoScroller/NanoScroller';
import SelectExt from '../../SelectExt/SelectExt';
import classNames from 'classnames';
import TooltipExt from '../../TooltipExt/TooltipExt';
import {
  CELL_DRAG_AREA_CLASS,
  CHANGE_CELL_MESSAGES,
  COLLAPSE_BUTTON_CLASS,
  CodeCompletionKeys,
  DROP_TARGET_CLASS,
  ECallApiMethod,
  ENotebookCellTypes,
  ENotebookToolbarActions,
  EXPAND_COLLAPSED_BUTTON_CLASS,
  INPUT_TARGET_CLASS,
  NotebookModes,
  PROMPT_CELL_CLASS,
  addChatIconToPromptCell,
  cellEditorFindOverrideConfig,
  changeCellOptions,
  createPromptCell,
  fetchPykernelserverInfo,
  getApiLoader,
  getCellById,
  getCursorPositionInCell,
  getFastNbCellTypeFromJupyterCell,
  getJupyterEquivalentCellType,
  getKeyBinding,
  getNextCell,
  isAtBottomOrTop,
  isMarkdownCellNotPromptCell,
  isPromptCell,
  removeChatIconFromPromptCell,
} from '../FastNotebookUtils';
import AddNewFastNotebookCell from './AddNewFastNotebookCell';
import ContainerElem from './ContainerElem';
import FastNotebookCodeSuggestions from './FastNotebookCodeSuggestions';
import FastNotebookCellTemplateRenderer from '../../FastNotebookCellTemplateRenderer/FastNotebookCellTemplateRenderer';
import { ECellTemplates } from '../../FastNotebookCellTemplateRenderer/templateUtils';
import styles from './FastNotebook.module.css';

interface IFastNotebookProps {
  notebook: Notebook;
  notebookId: string;
  kernelServerStatus: React.MutableRefObject<string>;
  ignoredFile: string;
  notebookToolbarAction?: {
    name: ENotebookToolbarActions;
    isNewCell: boolean;
  };
  pykernelEndpointInfo: MutableRefObject<{ endpoint: string | null; token: string | null }>;
  onClickSave?: () => void;
  setNotebookMode?: React.Dispatch<React.SetStateAction<any>>;
  isCommandMode?: boolean;
  showKeyboardShortcuts?: () => void;
  headlessMode?: boolean;
  onRender?: () => void;
}
//TODO:Chaitanya Few repetitive API calls while loading the notebook, cleanup required
const FastNotebook = (props: PropsWithChildren<IFastNotebookProps>) => {
  const {
    notebook,
    notebookId,
    ignoredFile,
    kernelServerStatus,
    pykernelEndpointInfo,
    notebookToolbarAction,
    onClickSave = () => {},
    setNotebookMode = () => {},
    isCommandMode = false,
    showKeyboardShortcuts = () => {},
    headlessMode = false,
    onRender,
  } = props;

  const [selectedCellPosition, setSelectedCellPosition] = useState({
    offsetTop: undefined,
    offsetWidth: undefined,
  });
  const [completerPosition, setCompleterPosition] = useState({ left: 0, top: 0 });
  const [showCodeSuggestions, setShowCodeSuggestions] = useState(false);
  const refScroller = useRef(null);
  const isCellExecutionInProgress = useRef(false);
  const currentExecutionSession = useRef(null); // Stores execution session id
  const cellQueueRef = useRef([]); // Stores id's of cells queued for execution
  const currentExecutionOutput = useRef([]); // Stores current execution output across multiple batches
  const currentCellExecutionCount = useRef(null); // Stores current execution count across multiple batches
  const inputRequestedRef = useRef(false); // Stores input requested flag
  const dragSourceRef = useRef({ startX: null, startY: null, cellIndex: null, currentMoveCellIndex: null }); // Stores drag source cell
  const cellEditorKeyHandlerRef = useRef(null); // Stores cell editor key handler, storing it in ref to dispose on cell change
  const prepareSelectedCell = useMemo(
    () => ({
      preExecution: (cell, isCodeCompletion?) => {
        const selectedCell = cell?.node;
        selectedCell?.classList.add('executing-cell');
        selectedCell?.appendChild(getApiLoader(isCodeCompletion));
      },
      postExecution: (cell) => {
        const selectedCell = cell?.node;
        document.getElementById('api-loader')?.remove();
        selectedCell?.classList?.remove('executing-cell');
      },
    }),
    [],
  );

  const cellExecutionFailed = (cellToExecute: CodeCell) => {
    if (!cellToExecute) return;

    prepareSelectedCell.postExecution(cellToExecute);
    isCellExecutionInProgress.current = false;
    setPrompt(cellToExecute, `${cellToExecute.model.executionCount || ''}`);
  };

  const cellExecutionStarted = (cellToExecute: CodeCell | MarkdownCell, isCodeCompletion?: boolean) => {
    isCellExecutionInProgress.current = true;
    // @ts-ignore
    if (!isCodeCompletion) cellToExecute?.model?.outputs?.clear();
    prepareSelectedCell.preExecution(cellToExecute, isCodeCompletion);
  };

  const handleCellBatchOutput = async (cellToExecute: CodeCell, result: any) => {
    const outputStreams = result?.outputStream;
    if (outputStreams && Array.isArray(outputStreams)) {
      outputStreams.forEach((element) => {
        if (element?.msg_type == 'execute_input') {
          currentCellExecutionCount.current = element?.content?.execution_count;
        } else {
          cellToExecute.outputArea.model.add({
            output_type: element?.msg_type,
            ...element?.content,
          });
        }
      });
    }
    const inputRequest = result?.inputRequest;
    if (inputRequest) {
      // @ts-ignore
      cellToExecute.outputArea.onInputRequest(inputRequest, {});
      inputRequestedRef.current = true;
    }
    setPrompt(cellToExecute, '*');
  };

  const performPromptCellAction = (cellList) => {
    cellList?.forEach((cell) => {
      performCellCompletionAction(cell);
    });
  };

  const performCellCompletionAction = ({ cellType = 'code', content = null, index = 0, mode = 'INSERT' }) => {
    if (content === null) {
      REActions.addNotificationError('Oops! No output generated');
      return;
    }

    let cell = null;
    if (cellType.toLowerCase() === 'code') {
      cell = notebook?.contentFactory?.createCodeCell(
        {
          rendermime: notebook?.rendermime,
          model: new CodeCellModel({
            id: uuid.v4(),
            cell: {
              cell_type: 'code',
              source: content,
              metadata: {},
            },
          }),
        },
        notebook,
      );
    } else if (cellType.toLowerCase() === 'markdown') {
      cell = notebook?.contentFactory?.createMarkdownCell(
        {
          rendermime: notebook?.rendermime,
          model: new MarkdownCellModel({
            id: uuid.v4(),
            cell: {
              cell_type: 'markdown',
              source: content,
              metadata: {},
            },
          }),
        },
        notebook,
      );
    }

    if (cell && mode.toLowerCase() === 'insert') {
      notebook.model.cells.insert(index + 1, cell.model);
    }
  };

  const callPykernelEndpoint = useCallback(
    async (apiName, params) => {
      try {
        pykernelEndpointInfo.current = await fetchPykernelserverInfo();
        const promise = REClient_.promises_().postCustom(
          `${pykernelEndpointInfo.current?.endpoint}/${apiName}`,
          {
            ...(params || {}),
          },
          {
            extraHeaders: {
              Authorization: `Bearer ${pykernelEndpointInfo.current?.token || ''}`,
            },
            doNotSendExtraHeader: true,
          },
        );
        return promise;
      } catch (err) {
        REActions.addNotificationError(Constants.errorDefault);
      }
    },
    [pykernelEndpointInfo],
  );

  const _requestCodeExecution = useCallback(async (notebookId: string, sourceCode: string, uiContext: any, sessionId?: string) => {
    try {
      const promise = callPykernelEndpoint(ECallApiMethod.requestCodeExecution, {
        codeBlock: sourceCode,
        uiContext: uiContext,
        sessionId: sessionId,
        notebookId: notebookId,
      });
      return promise;
    } catch (err) {
      REActions.addNotificationError(Constants.errorDefault);
    }
  }, []);

  const _pollExecutionResult = useCallback(async (sessionId: string) => {
    try {
      const promise = callPykernelEndpoint(ECallApiMethod.pollExecutionOutput, { sessionId: sessionId });
      return promise;
    } catch (err) {
      REActions.addNotificationError(Constants.errorDefault);
    }
  }, []);

  const _interruptKernel = useCallback(async (sessionId: string) => {
    try {
      const promise = callPykernelEndpoint(ECallApiMethod.interruptKernel, { sessionId: sessionId });
      return promise;
    } catch (err) {
      REActions.addNotificationError(Constants.errorDefault);
    }
  }, []);

  const _restartKernel = useCallback(async (sessionId: string) => {
    try {
      const promise = callPykernelEndpoint(ECallApiMethod.restartKernel, { sessionId: sessionId });
      return promise;
    } catch (err) {
      REActions.addNotificationError(Constants.errorDefault);
    }
  }, []);

  const _sendInputReply = useCallback(async (sessionId: string, inputValue: string) => {
    try {
      const promise = callPykernelEndpoint(ECallApiMethod.sendInputReply, { sessionId: sessionId, inputValue: inputValue });
      return promise;
    } catch (err) {
      REActions.addNotificationError(Constants.errorDefault);
    }
  }, []);

  const requestCodeExecutionResult = async (cellToExecute: CodeCell, sessionId: string) => {
    if (!sessionId) {
      cellExecutionFailed(cellToExecute);
      return;
    }

    try {
      const res = await _pollExecutionResult(currentExecutionSession.current);
      if (!res?.success) {
        REActions.addNotificationError(res.error || res?.result?.error || Constants.errorDefault);
        cellExecutionFailed(cellToExecute);
        return;
      }

      const result = res?.result;
      if (result?.state === 'busy') {
        handleCellBatchOutput(cellToExecute, result);

        setTimeout(() => {
          requestCodeExecutionResult(cellToExecute, currentExecutionSession.current);
        }, 1000);
      } else if (result?.state === 'idle') {
        handleCellBatchOutput(cellToExecute, result);
        const executionCount = currentCellExecutionCount.current || cellToExecute.model.executionCount || '';

        prepareSelectedCell.postExecution(cellToExecute);
        isCellExecutionInProgress.current = false;
        cellToExecute.model.executionCount = executionCount;
        setPrompt(cellToExecute, `${executionCount}`);
        executeCellInQueue();
      }
    } catch (e) {
      REActions.addNotificationError(e?.message || Constants.errorDefault);
      cellExecutionFailed(cellToExecute);
      cellQueueRef.current = [];
    }
  };

  const requestCodeExecution = async (cellToExecute: any) => {
    if (!cellToExecute) return;

    const cellConfig = cellToExecute?.model?.toJSON();
    cellExecutionStarted(cellToExecute);
    try {
      const res = await _requestCodeExecution(notebookId, cellConfig?.source, JSON.stringify({ cell_id: cellConfig?.id }), currentExecutionSession.current);
      if (!res.success) {
        REActions.addNotificationError(res.error || res?.result?.error || Constants.errorDefault);
        cellExecutionFailed(cellToExecute);
        return;
      }
      currentExecutionSession.current = res?.result?.session_id;
      currentExecutionOutput.current = [];
      currentCellExecutionCount.current = cellToExecute.model.executionCount;
      requestCodeExecutionResult(cellToExecute, currentExecutionSession.current);
    } catch (e) {
      REActions.addNotificationError(e?.message || Constants.errorDefault);
      cellExecutionFailed(cellToExecute);
      cellQueueRef.current = [];
    }
  };

  const requestCodeCompletion = async (key: string, cellToExecute: CodeCell | MarkdownCell) => {
    if (!key || !cellToExecute) return;
    if (isCellExecutionInProgress.current) {
      REActions.addNotificationError('Code completion is not supported while cell execution is in progress');
      return;
    }
    if (isMarkdownCellNotPromptCell(cellToExecute)) {
      REActions.addNotificationError('Code completion is not supported for markdown cells');
      return;
    }

    cellExecutionStarted(cellToExecute, true);
    const previousCells =
      notebook?.widgets?.map((cellWidget: CodeCell, index) => {
        const cellModel = cellWidget?.model as CodeCellModel;
        return {
          allData: JSON.stringify(cellModel?.toJSON()),
          metadata: JSON.stringify(cellModel?.metadata?.toJSON()),
          trusted: cellModel?.trusted,
          type: cellModel?.type,
          content: cellModel?.value.text,
          id: cellModel?.id,
          isActive: notebook?.activeCellIndex === index,
        };
      }) || [];

    try {
      const res = await REClient_.promises_().getNotebookCellCompletion(key, JSON.stringify(previousCells));
      if (!res.success) {
        REActions.addNotificationError(res.error || res?.result?.error || Constants.errorDefault);
        // @ts-ignore
        cellExecutionFailed(cellToExecute);
        return;
      }

      isCellExecutionInProgress.current = false;
      // @ts-ignore
      setPrompt(cellToExecute, `${cellToExecute.model.executionCount || ''}`);
      prepareSelectedCell.postExecution(cellToExecute);
      if (Array.isArray(res?.result)) {
        performPromptCellAction(res?.result);
      } else {
        performCellCompletionAction(res?.result);
      }
    } catch (e) {
      REActions.addNotificationError(e?.message || Constants.errorDefault);
      // @ts-ignore
      cellExecutionFailed(cellToExecute);
    }
  };

  const interruptKernel = async () => {
    try {
      if (currentExecutionSession.current === null) return;
      const res = await _interruptKernel(currentExecutionSession.current);
      if (!res?.success) {
        REActions.addNotificationError(res.error || res?.result?.error || Constants.errorDefault);
      } else {
        cellQueueRef.current.forEach((cellId: string) => {
          const { cell, index } = getCellById(notebook, cellId);
          setPrompt(cell, `${cell.model.executionCount || ''}`);
        });
        cellQueueRef.current = [];
      }
    } catch (err) {
      REActions.addNotificationError(Constants.errorDefault);
    }
  };

  const restartKernel = async () => {
    try {
      if (currentExecutionSession.current === null) return;
      const res = await _restartKernel(currentExecutionSession.current);
      if (!res?.success) {
        REActions.addNotificationError(res.error || res?.result?.error || Constants.errorDefault);
      } else {
        cellQueueRef.current.forEach((cellId: string) => {
          const { cell, index } = getCellById(notebook, cellId);
          setPrompt(cell, `${cell.model.executionCount || ''}`);
        });
        currentExecutionSession.current = null;
        cellQueueRef.current = [];
      }
      REActions.addNotification('Kernel restarted successfully');
    } catch (err) {
      REActions.addNotificationError(Constants.errorDefault);
    }
  };

  const sendInputReply = async (inputValue: string) => {
    try {
      const res = await _sendInputReply(currentExecutionSession.current, inputValue);
      if (!res?.success) {
        REActions.addNotificationError(res.error || res?.result?.error || Constants.errorDefault);
        return;
      }
    } catch (e) {
      REActions.addNotificationError(e?.message || Constants.errorDefault);
    }
  };

  const getNextCellAndSelect = (cellToExecute?: Cell) => {
    if (!cellToExecute || isPromptCell(cellToExecute)) return;

    const { nextCell, nextCellIndex } = getNextCell(notebook, cellToExecute);
    if (nextCell) {
      notebook.activeCellIndex = nextCellIndex;
      notebook.scrollToPosition(nextCellIndex);
    }
  };

  const executeCell = (cellToExecute?: Cell) => {
    // cellToExecute?.node?.scrollIntoView({block: "center", inline: "nearest"});
    requestCodeExecution(cellToExecute);
  };

  const setPrompt = (cellToExecute: Cell, value) => {
    if (cellToExecute instanceof CodeCell) {
      cellToExecute?.setPrompt?.(value || '*');
    }
  };

  const prepareCellForExecution = (isRunAll?: boolean) => {
    if (kernelServerStatus.current !== 'ACTIVE') {
      REActions.addNotificationError('Please wait, Server connection in progress');
      return;
    }

    if (isRunAll) {
      cellQueueRef.current = notebook?.widgets?.map((cell: MarkdownCell) => {
        if (isMarkdownCellNotPromptCell(cell)) {
          cell.rendered = true;
        } else if (isPromptCell(cell)) {
          // return cell?.model?.id;
        } else {
          setPrompt(cell, '*');
          return cell?.model?.id;
        }
      });
      cellQueueRef.current = cellQueueRef.current.filter((value) => value !== undefined);
    } else {
      if (isMarkdownCellNotPromptCell(notebook?.activeCell)) {
        // @ts-ignore
        notebook.activeCell.rendered = true;
      } else if (isPromptCell(notebook?.activeCell)) {
        cellQueueRef.current.push(notebook?.activeCell?.model?.id);
      } else {
        setPrompt(notebook?.activeCell, '*');
        cellQueueRef.current.push(notebook?.activeCell?.model?.id);
      }
      getNextCellAndSelect(notebook.activeCell);
    }

    if (!isCellExecutionInProgress.current) {
      executeCellInQueue();
    }
  };

  const executeCellByTemplateAction = (cellIndex: number) => {
    notebook.activeCellIndex = cellIndex;
    prepareCellForExecution();
  };

  const handleCommandModeKeyBindings = (e, key) => {
    const scrollContainer = refScroller.current?.refOverScroll?.current?.osInstance().elements()?.viewport;
    if (key.ENTER) {
      e.preventDefault();
      setNotebookMode(NotebookModes.EDIT);
    } else if (key.SELECT_CELL_ABOVE) {
      e.preventDefault();
      notebook.activeCellIndex = notebook.activeCellIndex - 1;
    } else if (key.SELECT_CELL_BELOW) {
      e.preventDefault();
      notebook.activeCellIndex = notebook.activeCellIndex + 1;
    } else if (key.INSERT_CELL_ABOVE) {
      e.preventDefault();
      NotebookActions.insertAbove(notebook);
    } else if (key.INSERT_CELL_BELOW) {
      e.preventDefault();
      NotebookActions.insertBelow(notebook);
    } else if (key.CHANGE_CELL_TYPE_TO_PROMPT_CELL) {
      e.preventDefault();
      !Constants.disableAiFunctionalities && changeCellType(ENotebookCellTypes.promptCell);
    } else if (key.SAVE_BY_KEY_S) {
      e.preventDefault();
      onClickSave();
    } else if (key.CHANGE_CELL_TYPE_TO_MARKDOWN) {
      e.preventDefault();
      changeCellType(ENotebookCellTypes.markdown);
    } else if (key.CHANGE_CELL_TYPE_TO_CODE) {
      e.preventDefault();
      changeCellType(ENotebookCellTypes.code);
    } else if (key.SHOW_ALL_KEYBOARD_SHORTCUTS) {
      e.preventDefault();
      showKeyboardShortcuts?.();
    } else if (key.SCROLL_TOP_OF_NOTEBOOK) {
    } else if (key.SCROLL_BOTTOM_OF_NOTEBOOK) {
    }
  };

  const handleEditModeKeyBindings = (e, key) => {
    if (key.PYTHON_FUNCTION_CODE_COMPLETION) {
      e.preventDefault();

      !Constants.disableAiFunctionalities && requestCodeCompletion(CodeCompletionKeys.PYTHON_FUNCTION, notebook?.activeCell as CodeCell);
    } else if (key.ABACUS_API_CODE_COMPLETION) {
      e.preventDefault();

      !Constants.disableAiFunctionalities && requestCodeCompletion(CodeCompletionKeys.ABACUS_API, notebook?.activeCell as CodeCell);
    } else if (key.ESCAPE) {
      e.preventDefault();

      setNotebookMode(NotebookModes.COMMAND);
      notebook.activeCell.editorWidget.editor.blur();
      notebook.deselectAll();
    } else if (key.ENTER && inputRequestedRef.current && e.srcElement.className == INPUT_TARGET_CLASS) {
      e.preventDefault();

      sendInputReply(e.srcElement.value);
      inputRequestedRef.current = false;
    }
  };

  /**
   * @method handleCellTabKeyPress
   * Show code suggestion on tab key press only if
   * 1. Cursor is not at the start of the line
   * 2. No text is selected
   */
  const handleCellTabKeyPress = (e, cell: Cell) => {
    const { end, start } = cell?.editor?.getSelection();
    const isTextSelected = end?.line !== start.line || end.column !== start.column;
    const isCursorAtStartOfLine = start.column === 0;

    if (cell instanceof CodeCell && !isTextSelected && !isCursorAtStartOfLine && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e?.preventDefault();
      const { topPosition, leftPosition } = getCursorPositionInCell(cell);
      setCompleterPosition({ top: topPosition, left: leftPosition });
      setShowCodeSuggestions(true);
    }
  };

  const handleCodeCellEditorKeyEvents = (cell) => {
    cell?.editor?.setOption('extraKeys', cellEditorFindOverrideConfig); // Override default key bindings for cell editor

    cellEditorKeyHandlerRef.current = cell?.editor?.addKeydownHandler((cellEditorInstance, event) => {
      const key = getKeyBinding(event);

      if (key.TAB) {
        handleCellTabKeyPress(event, cell);
      }
    });
  };

  const onKeyDown = (e) => {
    let selectedCell = notebook?.activeCell?.node;
    if (e?.target === null || selectedCell === null || showCodeSuggestions) return;
    const key = getKeyBinding(e);

    if (key.SAVE_NOTEBOOK) {
      e.preventDefault();
      onClickSave();
      return;
    }
    if (key.EXECUTE_CELL) {
      e.preventDefault();
      prepareCellForExecution();
      return;
    }

    if (isCommandMode) {
      handleCommandModeKeyBindings(e, key);
    } else {
      handleEditModeKeyBindings(e, key);
    }
  };

  const getSelectedCell = (notebook: Notebook, e) => {
    const x = e.clientX,
      y = e.clientY,
      cells = notebook.widgets;
    let clickedCell: any,
      cellIndex = -1;
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const rect = cell.node.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        clickedCell = cell;
        cellIndex = i;
        break;
      }
    }
    return { cell: clickedCell, cellIndex };
  };

  const executeCellInQueue = () => {
    const cellId = cellQueueRef.current.shift();

    const { cell, index } = getCellById(notebook, cellId);
    if (isPromptCell(cell)) {
      requestCodeCompletion(CodeCompletionKeys.PYTHON_FUNCTION, cell as CodeCell);
    } else if (cell) {
      executeCell(cell);
    } else {
      // REActions.addNotification('Execution completed successfully');
    }
  };

  const handleNotebookToolbarAction = (action) => {
    const actionName = action?.name;

    if (actionName === ENotebookToolbarActions.execute) {
      prepareCellForExecution();
    } else if (actionName === ENotebookToolbarActions.insertCellBelow) {
      NotebookActions.insertBelow(notebook);
    } else if (actionName === ENotebookToolbarActions.deleteCell) {
      NotebookActions.deleteCells(notebook);
    } else if (actionName === ENotebookToolbarActions.insertMarkdownCellBelow) {
      NotebookActions.insertBelow(notebook);
      NotebookActions.changeCellType(notebook, 'markdown');
    } else if (actionName === ENotebookToolbarActions.insertPromptCellBelow) {
    } else if (actionName === ENotebookToolbarActions.runAllCells) {
      prepareCellForExecution(true);
    } else if (actionName === ENotebookToolbarActions.interruptKernel) {
      interruptKernel();
    } else if (actionName === ENotebookToolbarActions.restartKernel) {
      restartKernel();
    }
  };

  const setCellToolbarPosition = (n, cell: Cell) => {
    setSelectedCellPosition({
      offsetTop: cell?.node?.offsetTop,
      offsetWidth: cell?.node?.offsetWidth,
    });
  };

  const addPromptCellStyles = () => {
    notebook?.widgets?.forEach((cell: Cell) => {
      if (isPromptCell(cell)) {
        const promptCell = cell as MarkdownCell;
        promptCell.node.classList.add('fast-nb-prompt-cell');
        promptCell.rendered = false;
        addChatIconToPromptCell(cell);
      }
    });
  };

  const changeCellType = (newCellType) => {
    if (!newCellType) return;

    const jupyterEquivalentCellType = getJupyterEquivalentCellType(newCellType);
    NotebookActions.changeCellType(notebook, jupyterEquivalentCellType);

    const updatedCell = notebook?.activeCell as Cell;
    if (newCellType === ENotebookCellTypes.promptCell) {
      updatedCell.model.metadata.set('isPromptCell', true);
      updatedCell.model.metadata.set('customClasses', [PROMPT_CELL_CLASS]);
      updatedCell.addClass(PROMPT_CELL_CLASS);
      addChatIconToPromptCell(updatedCell);
    } else {
      updatedCell.model.metadata.set('isPromptCell', false);
      updatedCell.model.metadata.set('customClasses', []);
      updatedCell.removeClass(PROMPT_CELL_CLASS);
      removeChatIconFromPromptCell(updatedCell);
    }
  };

  const confirmCellTypeChange = () => {
    let selectedType = '';
    const currentCellType = getFastNbCellTypeFromJupyterCell(notebook?.activeCell as Cell);
    const possibleCellOptions = changeCellOptions().filter((o) => o.value !== currentCellType);
    let modalRef = confirm({
      title: CHANGE_CELL_MESSAGES.TITLE,
      okText: CHANGE_CELL_MESSAGES.OK,
      cancelText: CHANGE_CELL_MESSAGES.CANCEL,
      maskClosable: true,
      content: (
        <div>
          <SelectExt placeholder={'Select new cell type'} onChange={({ value }) => (selectedType = value)} options={possibleCellOptions} />
        </div>
      ),
      onOk: () => {
        if (!selectedType) REActions.addNotification('Please select a cell type');

        changeCellType(selectedType);
      },
      onCancel: () => selectedType && modalRef?.destroy?.(),
    });
  };

  const onNewCellCreate = ({ key }) => {
    if (!key) return;

    if (key === ENotebookCellTypes.code) {
      NotebookActions.insertBelow(notebook);
    } else if (key === ENotebookCellTypes.markdown) {
      NotebookActions.insertBelow(notebook);
      NotebookActions.changeCellType(notebook, 'markdown');
    } else if (key === ENotebookCellTypes.promptCell) {
      createPromptCell(notebook);
    }
  };

  const moveCellUp = () => {
    NotebookActions.moveUp(notebook);
    NotebookActions.deselectAll(notebook);
    setCellToolbarPosition(null, notebook?.activeCell as Cell);
  };

  const moveCellDown = () => {
    NotebookActions.moveDown(notebook);
    NotebookActions.deselectAll(notebook);
    setCellToolbarPosition(null, notebook?.activeCell as Cell);
  };

  const onMouseUp = (e) => {
    if (dragSourceRef.current.cellIndex === null) return;

    const { cell: dragEndCell, cellIndex: dragEndCellIndex } = getSelectedCell(notebook, e);

    if (dragEndCellIndex !== dragSourceRef.current.cellIndex) {
      const isMoveUp = dragEndCellIndex < dragSourceRef.current.cellIndex;
      const cellsToMove = Math.abs(dragEndCellIndex - dragSourceRef.current.cellIndex);
      if (isMoveUp) {
        Array(cellsToMove)
          .fill(1)
          .forEach(() => NotebookActions.moveUp(notebook));
      } else {
        Array(cellsToMove - 1)
          .fill(1)
          .forEach(() => NotebookActions.moveDown(notebook));
      }
      notebook.deselectAll();
    }

    notebook.widgets.forEach((cell: Cell) => cell.node.classList.remove(DROP_TARGET_CLASS));
    dragSourceRef.current = {
      startX: null,
      startY: null,
      cellIndex: null,
      currentMoveCellIndex: null,
    };
  };

  const onMouseDown = (e) => {
    onNodeClick(e);
    const isCellDragArea = !e.target.className?.includes(COLLAPSE_BUTTON_CLASS) && e.target.closest(`.${CELL_DRAG_AREA_CLASS}`);

    if (e.which === 3 || e.button === 2 || !isCellDragArea) return; // Do not initiate drag on right click

    dragSourceRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      cellIndex: notebook?.activeCellIndex,
      currentMoveCellIndex: notebook?.activeCellIndex,
    };
  };

  const onMouseMove = _.throttle((e) => {
    if (dragSourceRef.current.cellIndex === null) return;
    const scrollContainer = refScroller.current?.refOverScroll?.current?.osInstance().elements()?.viewport;

    const { cell, cellIndex } = getSelectedCell(notebook, e);
    if (cellIndex === -1 || cellIndex === dragSourceRef.current.currentMoveCellIndex) return;

    const previousCellMoved = dragSourceRef.current.currentMoveCellIndex; // This holds the previous cell on which mouse was moved
    notebook.widgets[previousCellMoved]?.node.classList.remove(DROP_TARGET_CLASS);
    dragSourceRef.current.currentMoveCellIndex = cellIndex; // Store the current cell on which mouse is moved
    cell.node.classList.add(DROP_TARGET_CLASS);

    const { isAtBottom, isAtTop } = isAtBottomOrTop(e);

    if (isAtBottom || isAtTop) {
      scrollContainer?.scroll({
        top: cell.node.offsetTop - cell.node.offsetHeight,
        behavior: 'smooth',
      });
    }
  }, 500);

  const onNodeClick = (e) => {
    if (e?.target === null || notebook === null || e?.target?.className?.includes(COLLAPSE_BUTTON_CLASS) || e?.target?.closest(`.${EXPAND_COLLAPSED_BUTTON_CLASS}`)) return;

    const { cell, cellIndex } = getSelectedCell(notebook, e);
    if (cell && cellIndex !== -1) {
      cellEditorKeyHandlerRef.current?.dispose?.(); // Dispose the previous cell editor key handler
      setShowCodeSuggestions(false);

      notebook.activeCellIndex = cellIndex;

      if (isPromptCell(cell) || cell instanceof CodeCell) {
        setNotebookMode(NotebookModes.EDIT);
      } else if (cell instanceof MarkdownCell && cell.rendered && e?.type === 'dblclick') {
        cell.rendered = false;
        setNotebookMode(NotebookModes.EDIT);
      }

      handleCodeCellEditorKeyEvents(cell);
    }
  };

  useEffect(() => {
    if (!notebookToolbarAction?.name) return;
    if (notebookToolbarAction?.isNewCell) {
      onNewCellCreate({ key: notebookToolbarAction?.name });
    } else {
      handleNotebookToolbarAction(notebookToolbarAction);
    }
  }, [notebookToolbarAction]);

  useEffect(() => {
    if (!notebook?.node) return;
    const notebookRootNode = notebook?.node;

    addPromptCellStyles();
    notebook.mode = isCommandMode ? NotebookModes.COMMAND : NotebookModes.EDIT;
    notebookRootNode?.classList.add('notebook-root'); // set notebook root node class
    notebook.activeCellChanged.connect(setCellToolbarPosition);
    notebookRootNode?.addEventListener('dblclick', onNodeClick);
    notebookRootNode?.addEventListener('mousedown', onMouseDown);
    notebookRootNode?.addEventListener('keydown', onKeyDown);
    notebookRootNode?.addEventListener('mouseup', onMouseUp);
    notebookRootNode?.addEventListener('mousemove', onMouseMove);
    if (!headlessMode) {
      notebookRootNode.focus();
    }
    onRender?.();
    return () => {
      notebookRootNode?.removeEventListener('mousedown', onMouseDown);
      notebookRootNode?.removeEventListener('keydown', onKeyDown);
      notebookRootNode?.removeEventListener('dblclick', onNodeClick);
      notebookRootNode?.addEventListener('mouseup', onMouseUp);
      notebookRootNode?.addEventListener('mousemove', onMouseMove);
    };
  }, [notebook, ignoredFile, isCommandMode]);

  useEffect(() => {
    setTimeout(() => {
      refScroller.current?.update?.();
    }, 0);
  }, [notebook?.node]);

  const renderCellToolbar = () => {
    if (!selectedCellPosition.offsetTop && !selectedCellPosition.offsetWidth) return <></>;

    const cellActions = [
      {
        name: 'Execute (Shift + Enter)',
        icon: <FontAwesomeIcon icon={faCirclePlay} />,
        onClick: () => prepareCellForExecution(),
      },
      {
        name: 'Change cell type',
        icon: <FontAwesomeIcon icon={faNotebook} />,
        onClick: () => confirmCellTypeChange(),
      },
      {
        name: 'Insert below',
        addCustomComponent: true,
        icon: <FontAwesomeIcon icon={faPlusLarge} transform={{ size: 16 }} />,
      },
      {
        name: 'Move up',
        icon: <FontAwesomeIcon icon={faArrowUp} transform={{ size: 16 }} />,
        onClick: () => moveCellUp(),
      },
      {
        name: 'Move down',
        icon: <FontAwesomeIcon icon={faArrowDown} transform={{ size: 16 }} />,
        onClick: () => moveCellDown(),
      },
      {
        name: 'Delete',
        onClick: () => NotebookActions.deleteCells(notebook),
        icon: <FontAwesomeIcon icon={faTrash} transform={{ size: 16 }} />,
      },
    ];
    return (
      <div
        className={styles.cellToolBarContainer}
        css={`
          top: ${selectedCellPosition.offsetTop + 6}px;
        `}
      >
        {cellActions.map((actions) =>
          actions.addCustomComponent ? (
            <AddNewFastNotebookCell
              actionIcon={
                <span key={actions?.name} onClick={actions?.onClick} className={styles.cellToolbarItem}>
                  {actions?.icon}
                </span>
              }
              onClick={onNewCellCreate}
            />
          ) : (
            <span key={actions?.name} onClick={actions?.onClick} className={styles.cellToolbarItem}>
              <TooltipExt color="#313131" title={actions?.name}>
                {actions?.icon}
              </TooltipExt>
            </span>
          ),
        )}
      </div>
    );
  };

  const notebookEle = (
    <>
      <ContainerElem key={'notebook-container' + ignoredFile} notebook={notebook} className={classNames(styles.notebook, headlessMode && styles.headlessNotebook)} />
      {renderCellToolbar()}
      <FastNotebookCellTemplateRenderer notebook={notebook} executeCell={executeCellByTemplateAction} headlessMode={headlessMode} />
    </>
  );

  return (
    <NanoScroller
      onlyVertical
      ref={(r1) => {
        refScroller.current = r1;
      }}
    >
      {notebookEle}
      {!headlessMode ? (
        <FastNotebookCodeSuggestions
          callPykernelEndpoint={callPykernelEndpoint}
          completerPosition={completerPosition}
          cell={notebook?.activeCell}
          currentExecutionSession={currentExecutionSession.current}
          notebookId={notebookId}
          showCodeSuggestions={showCodeSuggestions}
          setShowCodeSuggestions={setShowCodeSuggestions}
        />
      ) : null}
    </NanoScroller>
  );
};

export default React.memo(FastNotebook);
