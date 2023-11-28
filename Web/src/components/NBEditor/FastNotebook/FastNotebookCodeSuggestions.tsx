import React, { useCallback, useEffect, useRef, useState, PropsWithChildren } from 'react';
import { Cell, CodeCell } from '@jupyterlab/cells';
import { ECallApiMethod } from '../FastNotebookUtils';
import Constants from '../../../constants/Constants';
import REActions from '../../../actions/REActions';
import Select from 'antd/lib/select';
import styles from './FastNotebook.module.css';

interface IFastNotebookCodeSuggestions {
  callPykernelEndpoint: (method: ECallApiMethod, any) => Promise<any>;
  completerPosition: any;
  cell: Cell;
  currentExecutionSession: string;
  notebookId: string;
  showCodeSuggestions: boolean;
  setShowCodeSuggestions: (show: boolean) => void;
}

const FastNotebookCodeSuggestions = (props: PropsWithChildren<IFastNotebookCodeSuggestions>) => {
  const { callPykernelEndpoint, completerPosition, cell, currentExecutionSession, notebookId, showCodeSuggestions, setShowCodeSuggestions } = props;
  const [suggestions, setSuggestions] = useState([]);
  const selectRef = useRef(null);

  const getCursorPos = useCallback((editor, pos): number => {
    const lines = editor.model.value.text.split('\n');
    let cursorPos = 0;
    for (let i = 0; i < pos.line; i++) {
      cursorPos += lines[i].length + 1; // Add 1 for the newline character
    }
    cursorPos += pos.column;
    return cursorPos;
  }, []);

  const _requestPyCodeCompletion = useCallback(async (notebookId: string, sourceCode: string, cursorPosition: number, uiContext: any, sessionId?: string) => {
    try {
      const promise = callPykernelEndpoint(ECallApiMethod.requestPyCodeCompletion, {
        codeBlock: sourceCode,
        cursorPos: cursorPosition,
        uiContext: uiContext,
        sessionId: sessionId,
        notebookId: notebookId,
      });
      return promise;
    } catch (err) {
      REActions.addNotificationError(Constants.errorDefault);
    }
  }, []);

  const addCodeSuggestionsToEditor = (value) => {
    const cellContent = cell.model.value.text;
    const { line, column } = cell?.editor?.getCursorPosition();
    const lines = cellContent.split('\n');
    const lineContent = lines[line];

    //Insert the suggestion at the cursor position
    if (column <= lineContent.length) {
      const newText = `${lineContent.slice(0, column)} ${value}${lineContent.slice(column)}`;
      lines[line] = newText;
      cell.model.value.text = lines.join('\n');
      cell.editor.focus();
      cell.editor.setCursorPosition({ line, column: column + value.length + 1 });
    }

    setShowCodeSuggestions(false);
  };

  const getCodeSuggestions = async () => {
    let { source, id } = cell?.model?.toJSON();
    source = Array.isArray(source) ? source.join('\\n') : source;
    try {
      const res = await _requestPyCodeCompletion(notebookId, source, getCursorPos(cell?.editor, cell?.editor.getCursorPosition()), JSON.stringify({ cell_id: id }), currentExecutionSession);
      if (res?.success) {
        const matches = res?.result?.complete_reply?.metadata?._jupyter_types_experimental || [];
        let width = 0;
        const options = matches.map((m) => {
          return { label: `${m?.text}`, value: `${m?.text}`, type: m?.type, signature: m?.signature };
        });
        setSuggestions(options);
        selectRef.current?.focus();
      }
    } catch (e) {
      REActions.addNotificationError(e?.message || Constants.errorDefault);
    }
  };

  const renderOptions = () =>
    suggestions.map((item, index) => (
      <Select.Option className="completion-item" key={index} value={item?.value}>
        <div className={styles.optionContainer}>
          <span>{item?.label}</span>
          <span className="suggestion-type">{item?.type}</span>
        </div>
      </Select.Option>
    ));

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowCodeSuggestions(false);
    }
  };

  useEffect(() => {
    if (showCodeSuggestions) {
      getCodeSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [showCodeSuggestions]);

  return !showCodeSuggestions ? null : (
    <Select
      ref={selectRef}
      dropdownMatchSelectWidth
      open={suggestions.length > 0}
      style={{ width: 250, ...completerPosition }}
      defaultActiveFirstOption={true}
      showArrow={false}
      filterOption={false}
      onKeyDown={handleKeyDown}
      popupClassName={styles.completionPopup}
      className={styles.completionContainer}
      listHeight={200}
      listItemHeight={10}
      onSelect={addCodeSuggestionsToEditor}
    >
      {renderOptions()}
    </Select>
  );
};

export default React.memo(FastNotebookCodeSuggestions);
