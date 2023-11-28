import { Button } from 'antd';
import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Cell, CodeCell } from '@jupyterlab/cells';
import _ from 'lodash';
import styles from './PythonFunctionFeatureGroupRegisterTemplate.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDown } from '@fortawesome/free-solid-svg-icons';
interface PythonFunctionFeatureGroupRegisterTemplateProps {
  cell: Cell;
  executeCell: (cellIndex: number) => void;
  cellIndex: number;
}

// TODO(Chaitanya): Having separate templates is good for customizations on cell by cell basis, but are not sharing code, does it need refactor?
const PythonFunctionFeatureGroupRegisterTemplate = (props: PropsWithChildren<PythonFunctionFeatureGroupRegisterTemplateProps>) => {
  const { cell, executeCell, cellIndex } = props;
  const cellOriginalSourceRef = React.useRef<string>(cell.model.value.text);
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
        Register feature group
      </Button>
    </div>
  );
};

export default React.memo(PythonFunctionFeatureGroupRegisterTemplate);
