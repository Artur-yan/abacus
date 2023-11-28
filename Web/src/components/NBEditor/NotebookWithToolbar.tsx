import React, { PropsWithChildren, useMemo, useCallback, useEffect, useState } from 'react';
import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import styles from './NBEditor.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ENotebookToolbarActions, NOTEBOOK_CONTAINER_ID, NotebookModes, keyBindings } from './FastNotebookUtils';
import AddNewFastNotebookCell from './FastNotebook/AddNewFastNotebookCell';
import TooltipExt from '../TooltipExt/TooltipExt';
import { Button } from 'antd';
import confirm from 'antd/lib/modal/confirm';
import FastNotebook from './FastNotebook';
import classNames from 'classnames';

interface INotebookWithToolbarProps {
  onClickSave: () => void;
  notebook: any;
  kernelServerStatus: React.MutableRefObject<string>;
  notebookId: string;
  pykernelEndpointInfo: any;
  headlessMode?: boolean;
  openInJupyterElement?: JSX.Element;
  openInAbacusNbElement?: JSX.Element;
  onRender?: () => void;
}

const NotebookWithToolbar = (props: PropsWithChildren<INotebookWithToolbarProps>) => {
  const { onClickSave, notebook, kernelServerStatus, notebookId, pykernelEndpointInfo, headlessMode = false, openInJupyterElement = <></>, onRender, openInAbacusNbElement = <></> } = props;
  const [notebookToolbarAction, setNotebookToolbarAction] = useState({ name: null, isNewCell: false });
  const [notebookMode, setNotebookMode] = useState(NotebookModes.COMMAND);
  const ignoredFile = '';
  const showKeyboardShortcuts = useCallback(() => {
    let modalRef = confirm({
      className: 'keyboard-shortcuts-modal',
      title: 'Keyboard shortcuts',
      okText: 'ok',
      maskClosable: true,
      width: 600,
      cancelButtonProps: { style: { display: 'none' } },
      content: (
        <div className={styles.keysContainer}>
          {Object.keys(keyBindings).map((key, index) => (
            <div>
              <span className={styles.key}>{key}</span>
              <span className={styles.action}>{keyBindings[key]}</span>
            </div>
          ))}
        </div>
      ),
      onOk: () => modalRef?.destroy?.(),
    });
  }, []);

  const getNotebookToolbar = useMemo(() => {
    if (headlessMode) return null;
    const toolbarItems = [
      {
        text: 'Save',
        icon: <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faFloppyDisk').faFloppyDisk} />,
        onClick: () => onClickSave(),
      },
      {
        text: 'Execute',
        tooltip: 'Execute current cell (Shift + Enter)',
        icon: <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faPlay').faPlay} />,
        onClick: () => setNotebookToolbarAction({ name: ENotebookToolbarActions.execute, isNewCell: false }),
      },
      {
        text: 'Run all',
        tooltip: 'Execute all cells',
        icon: <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faForward').faForward} />,
        onClick: () => setNotebookToolbarAction({ name: ENotebookToolbarActions.runAllCells, isNewCell: false }),
      },
      {
        text: 'Add cell',
        tooltip: 'Add Prompt cell below current cell',
        addCustomComponent: true,
        icon: <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faPlus').faPlus} />,
        onClick: ({ key = '' }) => setNotebookToolbarAction({ name: key, isNewCell: true }),
      },
      {
        text: 'Delete',
        tooltip: 'Delete current cell',
        icon: <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faTrash').faTrash} />,
        onClick: () => setNotebookToolbarAction({ name: ENotebookToolbarActions.deleteCell, isNewCell: false }),
      },
      {
        text: 'Interrupt',
        tooltip: 'Interrupt kernel',
        icon: <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faStop').faStop} />,
        onClick: () => setNotebookToolbarAction({ name: ENotebookToolbarActions.interruptKernel, isNewCell: false }),
      },
      {
        text: 'Restart',
        tooltip: 'Restart kernel',
        icon: <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faSync').faSync} />,
        onClick: () => setNotebookToolbarAction({ name: ENotebookToolbarActions.restartKernel, isNewCell: false }),
      },
    ];
    return toolbarItems.map((item) =>
      item.addCustomComponent ? (
        <AddNewFastNotebookCell
          actionIcon={
            <Button type="text" icon={item?.icon} size="small" className={styles.notebookToolbarItem}>
              {item?.text}
            </Button>
          }
          onClick={item?.onClick}
        />
      ) : (
        <TooltipExt title={item?.tooltip}>
          <Button
            type="text"
            icon={item?.icon}
            // @ts-ignore
            onClick={item?.onClick}
            size="small"
            className={styles.notebookToolbarItem}
          >
            {item?.text}
          </Button>
        </TooltipExt>
      ),
    );
  }, [notebook]);

  const getEmbeddedModeToolbar = () => {
    return (
      <div className={styles.notebookToolbarTransparent}>
        <div>
          <span className={styles.notebookMode}>Mode: {notebookMode}</span>
          <span className={styles.runAllBtn} onClick={() => setNotebookToolbarAction({ name: ENotebookToolbarActions.runAllCells, isNewCell: false })}>
            <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faForward').faForward} style={{ paddingRight: 2 }} />
            <span>Run all</span>
          </span>
        </div>
        <div>
          <span>
            <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faCircle').faCircle} size="1x" color={kernelServerStatus.current === 'ACTIVE' ? '#29ce04' : '#ce9607'} /> Server:{' '}
            {kernelServerStatus.current === 'ACTIVE' ? 'Active' : 'Connecting'}
          </span>
          <span className={styles.openLink}>
            <FontAwesomeIcon color="#1890ff" icon={faUpRightFromSquare} style={{ paddingRight: 3 }} />
            {openInJupyterElement}
          </span>
          <span className={styles.openLink}>
            <FontAwesomeIcon color="#1890ff" icon={faUpRightFromSquare} style={{ paddingRight: 3 }} />
            {openInAbacusNbElement}
          </span>
        </div>
      </div>
    );
  };

  const getNotebookToolbarContent = () => (
    <div className={styles.notebookToolbar}>
      <div> {getNotebookToolbar}</div>
      <div>
        <span className={styles.notebookMode}>Mode: {notebookMode}</span>
        <span>
          <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faCircle').faCircle} size="1x" color={kernelServerStatus.current === 'ACTIVE' ? '#29ce04' : '#ce9607'} /> Server:{' '}
          {kernelServerStatus.current === 'ACTIVE' ? 'Active' : 'Connecting'}
        </span>
        <TooltipExt title="Keyboard shortcuts">
          <span className={styles.keyboardShortcuts} onClick={showKeyboardShortcuts}>
            <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faKeyboard').faKeyboard} size="1x" color={'#fff'} />
          </span>
        </TooltipExt>
      </div>
    </div>
  );

  return (
    <div className={styles.rightContainer}>
      {headlessMode ? getEmbeddedModeToolbar() : getNotebookToolbarContent()}
      <div id={NOTEBOOK_CONTAINER_ID} className={styles.notebookContainer}>
        <FastNotebook
          onClickSave={onClickSave}
          notebook={notebook}
          notebookId={notebookId}
          kernelServerStatus={kernelServerStatus}
          pykernelEndpointInfo={pykernelEndpointInfo}
          ignoredFile={ignoredFile}
          notebookToolbarAction={notebookToolbarAction}
          setNotebookMode={setNotebookMode}
          isCommandMode={notebookMode === NotebookModes.COMMAND}
          showKeyboardShortcuts={showKeyboardShortcuts}
          headlessMode={headlessMode}
          onRender={onRender}
        />
      </div>
    </div>
  );
};

export default React.memo(NotebookWithToolbar);
