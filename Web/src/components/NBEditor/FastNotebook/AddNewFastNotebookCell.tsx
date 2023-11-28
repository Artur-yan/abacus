import React, { useMemo } from 'react';
import { Dropdown } from 'antd';
import { ENotebookCellTypes } from '../FastNotebookUtils';
import Constants from '../../../constants/Constants';
import styles from './FastNotebook.module.css';

const AddNewFastNotebookCell = ({ actionIcon = <></>, onClick = ({ key }) => {} }) => {
  const cellTypes = useMemo(
    () => [
      {
        key: ENotebookCellTypes.code,
        label: 'Code cell',
      },
      {
        key: ENotebookCellTypes.markdown,
        label: 'Markdown cell',
      },
      !Constants.disableAiFunctionalities && {
        key: ENotebookCellTypes.promptCell,
        label: 'Prompt cell',
      },
    ],
    [],
  );

  return (
    <Dropdown menu={{ items: cellTypes, onClick, style: { backgroundColor: '#223347', color: '#fff' } }} placement="bottomRight" overlayClassName="cellOptionsDropdown">
      {actionIcon}
    </Dropdown>
  );
};

export default AddNewFastNotebookCell;
