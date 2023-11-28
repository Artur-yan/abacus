import { Button } from 'antd';
import { Cell, CodeCell } from '@jupyterlab/cells';
import React, { PropsWithChildren, useEffect, useState, useRef } from 'react';
import _ from 'lodash';
import styles from './PythonFunctionRegisterTemplate.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDown } from '@fortawesome/free-solid-svg-icons';
interface PythonFunctionRegisterTemplateProps {
  cell: Cell;
  executeCell: (cellIndex: number) => void;
  cellIndex: number;
}

const PythonFunctionRegisterTemplate = (props: PropsWithChildren<PythonFunctionRegisterTemplateProps>) => {
  const { cell, executeCell, cellIndex } = props;
  const cellOriginalSourceRef = useRef<string>(cell.model.value.text);
  const [isDisabled, setDisable] = useState<boolean>(false);
  const [showCode, setShowCode] = useState<boolean>(false);

  useEffect(() => {
    if (cell instanceof CodeCell) {
      cell.inputHidden = !showCode;
      cell.outputHidden = !showCode;
    }

    cell.editor.refresh();
  }, [showCode, cell]);

  const onCellContentChange: _.DebouncedFunc<(editor: any, event: any) => boolean> = _.debounce((editor, event) => {
    const updatedCellContent = editor?.model?.value?.text;
    setDisable(updatedCellContent === cellOriginalSourceRef.current);
  }, 300);

  useEffect(() => {
    const handler = cell.editor.addKeydownHandler(onCellContentChange);

    return () => {
      handler?.dispose();
    };
  }, [cell]);

  return (
    <div className={styles.container}>
      <FontAwesomeIcon className={styles.icon} onClick={() => setShowCode(!showCode)} icon={faAngleDown} {...(showCode && { rotation: 180 })} />
      <Button disabled={isDisabled} size="small" type="primary" onClick={() => executeCell(cellIndex)}>
        Register function
      </Button>
    </div>
  );
};

export default React.memo(PythonFunctionRegisterTemplate);
