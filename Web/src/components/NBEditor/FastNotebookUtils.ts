import { Cell, CodeCell, MarkdownCell, MarkdownCellModel } from '@jupyterlab/cells';
import _ from 'lodash';
import * as uuid from 'uuid';
import { calcImgSrc } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { Notebook, NotebookModel } from '@jupyterlab/notebook';
import { RenderMimeRegistry, standardRendererFactories } from '@jupyterlab/rendermime';
import { rendererFactory as plotlyRendererFactory } from 'jupyterlab-plotly/lib/plotly-renderer';
import { editorServices } from '@jupyterlab/codemirror';

const emptyNotebook = (source) => ({
  nbformat: 4,
  nbformat_minor: 5,
  cells: [
    {
      cell_type: 'code',
      source: source || '',
      metadata: {},
      execution_count: null,
      outputs: [],
      id: '61833898-412e-4850-af79-41b4defeb648',
    },
    {
      cell_type: 'code',
      source: '',
      metadata: {},
      execution_count: null,
      outputs: [],
      id: '61833898-412e-4850-af79-41b4defeb649',
    },
  ],
  metadata: {
    kernelspec: {
      display_name: 'Python 3 (ipykernel)',
      language: 'python',
      name: 'python3',
    },
    language_info: {
      codemirror_mode: {
        name: 'ipython',
        version: 3,
      },
      file_extension: '.py',
      mimetype: 'text/x-python',
      name: 'python',
      nbconvert_exporter: 'python',
      pygments_lexer: 'ipython3',
      version: '3.8.10',
    },
  },
});

export const createNewNotebook = (content) => {
  let notebookInstance: Notebook;
  let modelInstance: NotebookModel;
  let rendermime: RenderMimeRegistry;
  let notebookData = content || JSON.stringify(emptyNotebook(content));

  modelInstance = new NotebookModel({
    languagePreference: 'python',
    collaborationEnabled: false,
    isInitialized: true,
  });
  modelInstance.fromString(notebookData);

  rendermime = new RenderMimeRegistry({
    initialFactories: standardRendererFactories,
  });
  rendermime.addFactory(
    plotlyRendererFactory,
    0, // Add it as the first renderer factory
  );

  notebookInstance = new Notebook({
    rendermime: rendermime,
    mimeTypeService: editorServices.mimeTypeService,
    languagePreference: 'python',
  });
  notebookInstance.model = modelInstance;

  return { notebookInstance, modelInstance };
};

export const PROMPT_CELL_CLASS = 'fast-nb-prompt-cell';
export const INPUT_TARGET_CLASS = 'jp-Stdin-input';
export const DEFAULT_PROMPT_TEXT = '# Enter prompt text here';
export const DROP_TARGET_CLASS = 'jp-mod-dropTarget';
export const NOTEBOOK_TITLE_CONTAINER_HEIGHT = 65;
export const NOTEBOOK_CONTAINER_ID = 'notebook-container';
export const CELL_TEMPLATE_CONTAINER = 'fast-nb-cell-template-container';
export const HEADLESS_CELL_TEMPLATE_CONTAINER = `headless-${CELL_TEMPLATE_CONTAINER}`;
export const COLLAPSE_BUTTON_CLASS = 'jp-collapseHeadingButton';
export const EXPAND_COLLAPSED_BUTTON_CLASS = 'jp-showHiddenCellsButton';
export const CELL_DRAG_AREA_CLASS = 'jp-InputArea-prompt';
export const getCellById = (notebook, id) => {
  let obj = { cell: null, index: -1 };
  notebook.layout.widgets.forEach((cell: Cell, index: number) => {
    if (cell?.model?.id === id) {
      obj = { cell, index };
    }
  });

  return obj;
};

export const getCellIndexById = (notebook, id) => notebook.widgets.findIndex((cell) => cell?.model?.id === id);

export const getNextCell = (notebook, cell) => {
  const index = getCellIndexById(notebook, cell?.model?.id);
  return { nextCell: notebook.widgets[index + 1], nextCellIndex: index + 1 };
};

export const isFileOrFolderKeyVisible = (key) => {
  return key != null && key !== '' && !_.startsWith(key, '.');
};

export const isFileValue = (value, filename?: string) => {
  let res = value?.toUpperCase?.() === 'FILE';
  if (res === true && filename != null) {
    if (!_.endsWith((filename || '').toLowerCase(), '.ipynb')) {
      res = false;
    }
  }
  return res;
};

export const calcPathFromArray = (list) => {
  let res = null;
  list?.some((s1) => {
    res ??= '';
    if (res !== '') {
      res += '/';
    }
    res += s1;
  });
  return res;
};

export const cleanInvisibleFilesAndFolders = (tree) => {
  let res: any = tree == null ? tree : { ...tree };

  let kk = Object.keys(res ?? {});
  kk.some((k1) => {
    if (_.startsWith(k1, '.')) {
      delete res[k1];
    }

    if (_.isObject(res?.[k1]) && !_.isString(res?.[k1])) {
      res[k1] = cleanInvisibleFilesAndFolders(res[k1]);
    }
  });

  return res;
};

export const doWorkIterTree = (tree) => {
  if (_.isString(tree) || !_.isObject(tree)) {
    return null;
  }

  let kk = Object.keys(tree ?? {});
  let res = null;
  kk.some((k1) => {
    if (isFileOrFolderKeyVisible(k1)) {
      if (isFileValue(tree?.[k1], k1)) {
        res = [k1];
        return true;
      } else {
        let res2 = doWorkIterTree(tree?.[k1]);
        if (res2 != null) {
          res = [k1].concat(res2);
          return true;
        }
      }
    }
  });
  return res;
};

export const isValidPathInTree = (tree, pathList) => {
  if (pathList == null || pathList?.length === 0) {
    return true;
  } else {
    const doIterIn = (tree, pathToIter) => {
      if (tree == null || pathToIter == null) {
        return false;
      }
      if (pathToIter?.length === 0 || tree === 'FILE') {
        return true;
      }

      let s1 = pathToIter?.[0];
      let v1 = tree?.[s1];

      if (v1 == null) {
        return false;
      } else {
        return doIterIn(v1, pathToIter?.slice(1, 9999));
      }
    };

    return doIterIn(tree, pathList);
  }
};

export function getApiLoader(isCodeCompletion?): HTMLElement {
  const apiLoader = document.createElement('div');
  const loader = document.createElement('span');
  const loadingTxt = document.createElement('span');

  apiLoader.id = 'api-loader';
  loader.className = 'notebook-spinner';
  loadingTxt.className = 'loadingTxt';
  loadingTxt.innerText = isCodeCompletion ? 'Generating Code' : 'Executing code';
  apiLoader.appendChild(loader);
  apiLoader.appendChild(loadingTxt);

  return apiLoader;
}

export const enum ECallApiMethod {
  provisionNotebookDirectory = 'provisionNotebookDirectory',
  isNotebookDirectoryProvisioned = 'isNotebookDirectoryProvisioned',
  getNotebookDirectoryTree = 'getNotebookDirectoryTree',
  createNotebookFile = 'createNotebookFile',
  getNotebookFileContent = 'getNotebookFileContent',
  updateNotebookFileContent = 'updateNotebookFileContent',

  createNotebookFolder = 'createNotebookFolder',
  deleteNotebookFile = 'deleteNotebookFile',
  deleteNotebookFolder = 'deleteNotebookFolder',
  moveNotebookArtifact = 'moveNotebookArtifact',

  requestCodeExecution = 'execute',
  pollExecutionOutput = 'pollOutput',
  ensurePykernelserver = 'ensurePykernelserver',
  interruptKernel = 'interruptKernel',
  restartKernel = 'restartKernel',
  sendInputReply = 'sendInputReply',
  requestPyCodeCompletion = 'completeCode',
}

export const fetchPykernelserverInfo = async () => {
  try {
    const res = await REClient_.promises_()._getPykernelMetaserviceInfo();
    const pykernelserverMeta = res?.result;
    let endpoint = pykernelserverMeta?.endpoint;
    if (!pykernelserverMeta || !endpoint) {
      REActions.addNotificationError('Pykernelserver endpoint not available');
      return;
    }

    return { endpoint, token: pykernelserverMeta?.token };
  } catch (err) {
    REActions.addNotificationError(Constants.errorDefault);
  }
};

export const enum ENotebookToolbarActions {
  runAllCells = 'runAllCells',
  execute = 'execute',
  insertCellBelow = 'insertCellBelow',
  insertMarkdownCellBelow = 'insertMarkdownCellBelow',
  insertPromptCellBelow = 'insertPromptCellBelow',
  deleteCell = 'deleteCell',
  interruptKernel = 'interruptKernel',
  restartKernel = 'restartKernel',
}

export const enum ENotebookCellTypes {
  code = 'code',
  markdown = 'markdown',
  promptCell = 'promptCell',
}

export const enum JupyterClassNames {
  cell = '.jp-Cell',
}

export const enum CodeCompletionKeys {
  ABACUS_API = 'ABACUS_API',
  PYTHON_FUNCTION = 'PYTHON_FUNCTION',
}

export const isPromptCell = (cell) => cell instanceof MarkdownCell && cell?.model?.metadata?.get('isPromptCell');
export const isMarkdownCellNotPromptCell = (cell) => cell instanceof MarkdownCell && !isPromptCell(cell);
export const isMarkdownCell = (cell) => cell instanceof MarkdownCell;
export const getFastNbCellTypeFromJupyterCell = (cell) => {
  if (cell instanceof CodeCell) {
    return ENotebookCellTypes.code;
  } else if (cell instanceof MarkdownCell) {
    return isPromptCell(cell) ? ENotebookCellTypes.promptCell : ENotebookCellTypes.markdown;
  } else {
    return null;
  }
};

export const getPromptCellModel = (id) =>
  new MarkdownCellModel({
    id,
    cell: {
      cell_type: 'markdown',
      source: DEFAULT_PROMPT_TEXT,
      metadata: {
        isPromptCell: true,
        customClasses: [PROMPT_CELL_CLASS],
      },
    },
  });

export const createPromptCell = (notebook): MarkdownCell => {
  const cell = notebook?.contentFactory?.createMarkdownCell(
    {
      rendermime: notebook?.rendermime,
      model: getPromptCellModel(uuid.v4()),
    },
    notebook,
  );

  notebook.model.cells.insert(notebook.activeCellIndex + 1, cell.model);
  notebook.activeCellIndex = notebook.activeCellIndex + 1;
  // @ts-ignore
  notebook.activeCell.rendered = false;
  notebook.activeCell.node.classList.add(PROMPT_CELL_CLASS);
  addChatIconToPromptCell(notebook.activeCell);

  return cell;
};

export const addChatIconToPromptCell = (cell) => {
  const promptNode = cell?.node?.querySelector('.jp-InputPrompt');
  if (promptNode) {
    promptNode.style.backgroundImage = `url(${calcImgSrc('/imgs/prompt_cell_icon.webp')})`;
  }
};

export const removeChatIconFromPromptCell = (cell) => {
  const promptNode = cell?.node?.querySelector('.jp-InputPrompt');
  if (promptNode) {
    promptNode.style.backgroundImage = '';
  }
};

export const getJupyterEquivalentCellType = (type) => {
  switch (type) {
    case ENotebookCellTypes.code:
      return 'code';
    case ENotebookCellTypes.markdown:
      return 'markdown';
    case ENotebookCellTypes.promptCell:
      return 'markdown';
  }
};

export const CHANGE_CELL_MESSAGES = {
  TITLE: 'Change cell type',
  OK: 'CHANGE',
  CANCEL: 'CANCEL',
};

export const changeCellOptions = () => {
  let options = [
    { label: 'Code', value: ENotebookCellTypes.code },
    { label: 'Markdown', value: ENotebookCellTypes.markdown },
  ];
  !Constants.disableAiFunctionalities && options.concat({ label: 'Prompt Cell', value: ENotebookCellTypes.promptCell });
  return options;
};

export const keyBindings = {
  Enter: 'Enter Edit mode',
  'Shift + Enter': 'Run the current cell and select the one below',
  'Up arrow / k': 'Select the cell above',
  'Down arrow / j': 'Select the cell below',
  A: 'Insert a new cell above the current cell',
  B: 'Insert a new cell below the current cell',
  P: 'Change the cell type to prompt cell',
  M: 'Change the cell type to Markdown',
  Y: 'Change the cell type to code',
  S: 'Save the notebook',
  H: 'Show all available keyboard shortcuts',
  'Shift + Space': 'Scroll notebook up',
  Space: ' Scroll notebook down',
};

export const enum NotebookModes {
  EDIT = 'edit',
  COMMAND = 'command',
}

export const cellEditorFindOverrideConfig = {
  'Cmd-G': false,
  'Ctrl-F': false,
  'Cmd-F': false,
  'Cmd-/': (cm) => {
    cm.execCommand('toggleComment');
  },
  'Ctrl-/': (cm) => {
    cm.execCommand('toggleComment');
  },
};

export const getKeyBinding = (e) => ({
  SAVE_NOTEBOOK: (navigator.userAgent.indexOf('Mac OS X') !== -1 ? e.metaKey : e.ctrlKey) && e.keyCode === 83,
  EXECUTE_CELL: e.keyCode === 13 && e.shiftKey,
  ENTER: e.keyCode === 13,
  ESCAPE: e.key === 'Escape',
  SELECT_CELL_ABOVE: e.keyCode === 38 || e.key === 'k' || e.key === 'K',
  SELECT_CELL_BELOW: e.keyCode === 40 || e.key === 'j' || e.key === 'J',
  INSERT_CELL_ABOVE: e.key === 'a' || e.key === 'A',
  INSERT_CELL_BELOW: e.key === 'b' || e.key === 'B',
  CHANGE_CELL_TYPE_TO_PROMPT_CELL: e.key === 'p' || e.key === 'P',
  SAVE_BY_KEY_S: e.key === 's' || e.key === 'S',
  CHANGE_CELL_TYPE_TO_MARKDOWN: e.key === 'm' || e.key === 'M',
  CHANGE_CELL_TYPE_TO_CODE: e.key === 'y' || e.key === 'Y',
  SHOW_ALL_KEYBOARD_SHORTCUTS: e.key === 'h' || e.key === 'H',
  PYTHON_FUNCTION_CODE_COMPLETION: (e.key === 'l' || e.key === 'L') && e.ctrlKey,
  ABACUS_API_CODE_COMPLETION: (e.key === 'i' || e.key === 'I') && e.ctrlKey,
  SCROLL_TOP_OF_NOTEBOOK: e.shiftKey && (e.code === 'Space' || e.keyCode === 32),
  SCROLL_BOTTOM_OF_NOTEBOOK: e.code === 'Space' || e.keyCode === 32,
  TAB: e.keyCode === 9,
  UP_ARROW: e.keyCode === 38,
  DOWN_ARROW: e.keyCode === 40,
});
export const isAtBottomOrTop = (event) => {
  const container = document.getElementById(NOTEBOOK_CONTAINER_ID);
  const containerRect = container.getBoundingClientRect();
  const containerTop = containerRect.top + window.pageYOffset;
  const containerHeight = container.offsetHeight;
  const mousePosition = event.clientY - containerTop;
  const bottomThreshold = containerHeight * 0.8; // 10% from the bottom
  const topThreshold = containerHeight * 0.2; // 10% from the top

  return {
    isAtBottom: mousePosition >= bottomThreshold,
    isAtTop: mousePosition <= topThreshold,
  };
};

export const getCursorPositionInCell = (cell: Cell) => {
  const cellEditor = cell?.editor as CodeMirrorEditor;
  const cursorCoordinates = cellEditor?.cursorCoords(true, 'local');
  const topPosition = cell.node.offsetTop + cursorCoordinates.top + cellEditor.lineHeight + 15;
  const leftPosition = cell.node.offsetLeft + cursorCoordinates.left + 60;

  return { topPosition, leftPosition };
};
