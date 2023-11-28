import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NotebookModel } from '@jupyterlab/notebook';
import Input from 'antd/lib/input';
import { MenuProps } from 'antd/lib/menu';
import classNames from 'classnames';
import _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import { useDebounce } from '../../api/REUses';
import Constants from '../../constants/Constants';
import DropdownExt from '../DropdownExt/DropdownExt';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import ModalContent from '../ModalContent/ModalContent';
import { ECallApiMethod, calcPathFromArray, isFileValue } from '../NBEditor/FastNotebookUtils';
import NanoScroller from '../NanoScroller/NanoScroller';
import { ICallApiParams } from './NBEditor';
const styles = require('./NBExplorer.module.css');
const sd = require('../antdUseDark.module.css');

interface ITreeItemNB {
  [name: string]: ITreeItemNBItem;
}

type ITreeItemNBItem = 'FILE' | ITreeItemNB;
const opa1 = 0.9;

interface INBEditorTreeItemProps {
  callApi?: (method: ECallApiMethod, params?: ICallApiParams) => Promise<{ err?; res? }>;

  dataValue?: string;
  data?: ITreeItemNBItem;
  sel?: string[];
  onClick?: (parentFolders: string[], value: string, data: ITreeItemNBItem, e?) => void;

  parentFolders?: string[];
  forceRefreshTree?: () => void;
  isChanged?: boolean;
}

const NBEditorTreeItem = React.memo((props: PropsWithChildren<INBEditorTreeItemProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const isFile = isFileValue(props.data);
  const isFileNB = isFileValue(props.data, props.dataValue);

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isExpanded, setIsExpanded] = useState(false);

  const createNBFilename = useRef('');

  const onClickRoot = (e) => {
    if (isFile) {
      if (isFileNB) {
        props.onClick?.(parentFoldersSub, props.dataValue, props.data, e);
      }
    } else {
      setIsExpanded((isE1) => {
        return !isE1;
      });
    }
  };

  useEffect(() => {
    if (props.sel?.length > 0 && !isFile && !Utils.isNullOrEmpty(props.dataValue) && props.sel?.length >= (props.parentFolders?.length ?? 0)) {
      let pp = [...(props.parentFolders ?? [])];
      pp.push(props.dataValue);

      let forceExpanded = true;
      pp?.some((p1, p1ind) => {
        if (p1 !== props.sel?.[p1ind]) {
          forceExpanded = false;
          return true;
        }
      });

      if (forceExpanded) {
        setIsExpanded(true);
      }
    }
  }, [props.parentFolders, props.dataValue, isFile, props.sel]);

  const menuItem = useMemo(() => {
    let popupContainerForMenu = (node) => document.getElementById('body2');

    const onClickDelete = (isFolder?: boolean) => {
      return new Promise<boolean>((resolve) => {
        let pp = [...(props.parentFolders ?? [])];

        let path1 = calcPathFromArray(pp) || '';
        if (!_.startsWith(path1, '/')) {
          path1 += '/';
        }
        path1 += props.dataValue;

        let promise1 = null;
        if (isFolder) {
          promise1 = props.callApi?.(ECallApiMethod.deleteNotebookFolder, { folderPath: path1 });
        } else {
          promise1 = props.callApi?.(ECallApiMethod.deleteNotebookFile, { filePath: path1 });
        }
        promise1
          ?.then((res) => {
            let isOk = res?.success === true;
            if (isOk) {
              if (!isFolder) {
                setIsExpanded(true);
              }

              props.forceRefreshTree?.();
            } else {
              REActions.addNotificationError(`${isFolder ? 'Folder' : 'File'} deletion failed`);
            }

            resolve(isOk);
          })
          .catch((e) => {
            resolve(true);
            REActions.addNotificationError(`${isFolder ? 'Folder' : 'File'} deletion failed`);
          });
      });
    };

    const onRenamePromise = (isFolder?: boolean) => {
      return new Promise<boolean>((resolve) => {
        let fn1 = createNBFilename.current;
        if (Utils.isNullOrEmpty(fn1)) {
          REActions.addNotificationError(`Inpute is empty`);
        } else {
          let m1 = new NotebookModel({ languagePreference: 'python' });
          let contenNB = m1.toString();

          let pp = [...(props.parentFolders ?? [])];
          let path1 = calcPathFromArray(pp) || '';
          if (!_.startsWith(path1, '/')) {
            path1 += '/';
          }

          let pathOri = path1 + props.dataValue;
          path1 += fn1;

          if (pathOri === calcPathFromArray(props.sel)) {
            if (props.isChanged) {
              REActions.addNotificationError(`First, save changes in current notebook!`);
              resolve(true);
              return;
            }
          }

          let promise1 = props.callApi?.(ECallApiMethod.moveNotebookArtifact, { originalPath: pathOri, newPath: path1 });
          promise1
            ?.then((res) => {
              //@ts-ignore
              let isOk = res?.success === true;

              if (isOk) {
                if (!isFolder) {
                  setIsExpanded(true);
                }

                props.forceRefreshTree?.();
              } else {
                REActions.addNotificationError(`${isFolder ? 'Folder' : 'File'} rename failed`);
              }

              resolve(isOk);
            })
            .catch((e) => {
              resolve(true);
              REActions.addNotificationError(`${isFolder ? 'Folder' : 'File'} rename failed`);
            });
        }
      });
    };

    const onConfirmPromise = (isFolder = false) => {
      return new Promise<boolean>((resolve) => {
        let fn1 = createNBFilename.current;
        if (Utils.isNullOrEmpty(fn1)) {
          resolve(true);
        } else {
          let m1 = new NotebookModel({ languagePreference: 'python' });
          let contenNB = m1.toString();

          let pp = [...(props.parentFolders ?? [])];
          if (!isFileValue(props.data) && props.data != null && !Utils.isNullOrEmpty(props.dataValue) && _.isString(props.dataValue)) {
            pp.push(props.dataValue);
          }

          let path1 = calcPathFromArray(pp) || '';
          if (!_.startsWith(path1, '/')) {
            path1 += '/';
          }
          path1 += fn1;

          let promise1 = null;
          if (isFolder) {
            promise1 = props.callApi?.(ECallApiMethod.createNotebookFolder, { folderPath: path1 });
          } else {
            promise1 = props.callApi?.(ECallApiMethod.createNotebookFile, { filePath: path1, fileContent: contenNB });
          }
          promise1
            ?.then((res) => {
              let isOk = res?.success === true;

              if (isOk) {
                setIsExpanded(true);
                props.forceRefreshTree?.();
              } else {
                REActions.addNotificationError(`${isFolder ? 'Folder' : 'File'} creation failed`);
              }

              resolve(isOk);
            })
            .catch((e) => {
              resolve(true);
              REActions.addNotificationError(`${isFolder ? 'Folder' : 'File'} creation failed`);
            });
        }
      });
    };

    const createFolderElem = (
      <div css={``}>
        <div css={``}>Folder Name:</div>
        <div css={``}>
          <Input
            defaultValue={'Folder1'}
            onChange={(e) => {
              createNBFilename.current = e.target.value;
            }}
          />
        </div>
      </div>
    );

    const createNBElem = (
      <div css={``}>
        <div css={``}>Notebook Filename:</div>
        <div css={``}>
          <Input
            defaultValue={'filename.ipynb'}
            onChange={(e) => {
              createNBFilename.current = e.target.value;
            }}
          />
        </div>
      </div>
    );

    const renameNBElem = (
      <div css={``}>
        <div css={``}>{isFile ? 'Notebook Filename' : 'Folder'}:</div>
        <div css={``}>
          <Input
            defaultValue={props.dataValue}
            onChange={(e) => {
              createNBFilename.current = e.target.value;
            }}
          />
        </div>
      </div>
    );

    return {
      // theme: 'dark',
      getPopupContainer: popupContainerForMenu,
      items: [
        {
          key: 'createFolder',
          label: (
            <ModalContent
              okType={'primary'}
              okText={'Create'}
              cancelText={'Cancel'}
              onConfirmPromise={onConfirmPromise.bind(null, true)}
              onClick={(e) => {
                createNBFilename.current = 'Folder1';
              }}
              title={'New Folder'}
              content={createFolderElem}
            >
              <div className={styles.contextMenuItem}>
                <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faFolderPlus').faFolderPlus} className={styles.menuIcon} /> New Folder
              </div>
            </ModalContent>
          ),
        },
        {
          key: 'createNB',
          label: (
            <ModalContent
              okType={'primary'}
              okText={'Create'}
              cancelText={'Cancel'}
              onConfirmPromise={onConfirmPromise.bind(null, false)}
              onClick={(e) => {
                createNBFilename.current = 'filename.ipynb';
              }}
              title={'Create New Notebook'}
              content={createNBElem}
            >
              <div className={styles.contextMenuItem}>
                <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faFilePlus').faFilePlus} className={styles.menuIcon} /> New Notebook
              </div>
            </ModalContent>
          ),
        },

        {
          key: 'open',
          label: (
            <div className={styles.contextMenuItem}>
              <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faFolderPlus').faFolderPlus} className={styles.menuIcon} /> Open
            </div>
          ),
          onClick: (e) => {
            let pp = [...(props.parentFolders ?? [])];
            if (!isFileValue(props.data) && props.data != null && !Utils.isNullOrEmpty(props.dataValue) && _.isString(props.dataValue)) {
              pp.push(props.dataValue);
            }

            let path1 = calcPathFromArray(pp) || '';
            if (!_.startsWith(path1, '/')) {
              path1 += '/';
            }
            let pathOri = path1 + props.dataValue;

            if (pathOri === calcPathFromArray(props.sel)) {
              if (props.isChanged) {
                REActions.addNotificationError(`First, save changes in current notebook!`);
                return;
              }
            }

            onClickRoot(null);
          },
          hidden: true,
        },
        {
          key: 'rename',
          label: (
            <ModalContent
              okType={'primary'}
              okText={'Rename'}
              cancelText={'Cancel'}
              onConfirmPromise={onRenamePromise.bind(null, !isFile)}
              onClick={(e) => {
                createNBFilename.current = props.dataValue || '';
              }}
              title={'Rename...'}
              content={renameNBElem}
            >
              <div className={styles.contextMenuItem}>
                <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faPenToSquare').faPenToSquare} className={styles.menuIcon} /> Rename
              </div>
            </ModalContent>
          ),
        },
        {
          key: 'delete2',
          label: (
            <ModalConfirm
              onConfirmPromise={onClickDelete.bind(null, !isFile)}
              title={`Do you want to delete this ${isFile ? 'file' : 'folder'} "${props.dataValue}"?${isFile ? '' : ' All subfolders and files will be deleted too.'}`}
              icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
              okText={'Delete'}
              cancelText={'Cancel'}
              okType={'danger'}
            >
              <div className={classNames(styles.menuIcon, styles.red, styles.contextMenuItem)}>
                <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faTrash').faTrash} className={styles.menuIcon} /> Delete
              </div>
            </ModalConfirm>
          ),
        },
      ].filter((v1) => !v1?.hidden),
    } as MenuProps;
  }, [props.parentFolders, props.isChanged, props.sel, props.dataValue, props.data, createNBFilename.current, props.forceRefreshTree, props.callApi]);

  const parentFoldersSub = useMemo(() => {
    if (isFile) {
      return props.parentFolders;
    }

    let res = [];

    if (props.parentFolders != null && props.parentFolders?.length > 0) {
      res = res.concat(props.parentFolders);
    }

    res.push(props.dataValue);

    return res;
  }, [props.parentFolders, props.data, isFile]);

  const currentPathList = useMemo(() => {
    if (parentFoldersSub == null && (!isFile || Utils.isNullOrEmpty(props.dataValue))) {
      return null;
    }

    let res = [...(parentFoldersSub ?? [])];
    if (isFile) {
      return Utils.isNullOrEmpty(props.dataValue) ? res : res.concat([props.dataValue]);
    } else {
      return res;
    }
  }, [isFile, parentFoldersSub, props.dataValue]);

  const isSelected = useMemo(() => {
    if (!isFile || props.data == null) {
      return false;
    }
    if ((props.sel?.length ?? 0) > 0 && (currentPathList?.length ?? 0) > 0) {
      return _.isEqual(currentPathList, props.sel);
    }
    return false;
  }, [currentPathList, props.data, props.sel, isFile]);

  const subFoldersElem = useMemo(() => {
    if (isFile) {
      return null;
    }

    let res = [];

    const onClickItem = (parentFoldersSub, value, data, e) => {
      props.onClick?.(parentFoldersSub, value, data);
    };

    let pp = [...(props.parentFolders ?? [])];
    if (!Utils.isNullOrEmpty(props.dataValue)) {
      pp.push(props.dataValue);
    }

    let kk = Object.keys(props.data ?? {}).sort();
    kk.some((k1, k1ind) => {
      let v1 = props.data?.[k1];
      const isFile = v1 === 'FILE';

      res.push(
        <NBEditorTreeItem
          isChanged={props.isChanged}
          forceRefreshTree={props.forceRefreshTree}
          parentFolders={pp}
          callApi={props.callApi}
          key={'item_tree_' + (props.parentFolders ?? []).join('_') + k1ind}
          sel={props.sel}
          dataValue={k1}
          data={v1}
          onClick={onClickItem}
        />,
      );
    });

    return res;
  }, [isFile, props.data, props.parentFolders, props.isChanged, props.onClick, props.callApi, props.sel]);

  const onMouseDown = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
  };

  return (
    <>
      <DropdownExt overlayClassName="file-browser-context-menu" menu={menuItem} trigger={['contextMenu']}>
        <div
          onContextMenu={onMouseDown}
          onMouseDown={onMouseDown}
          onClick={onClickRoot}
          className={sd.ellipsisParent}
          css={`
            ${isSelected ? `color: ${Constants.blue}; ` : ``} border: 1px solid transparent;
            padding: 2px 4px 5px;
            border-radius: 3px;
            display: flex;
            align-items: center;
            cursor: pointer;
            &:hover {
              background: rgba(255, 255, 255, 0.1);
              color: white !important;
              border: 1px solid rgba(255, 255, 255, 0.2);
            }
          `}
        >
          <span
            css={`
              display: flex;
              width: 20px;
              align-items: center;
              justify-content: center;
            `}
          >
            {!isFile && (
              <FontAwesomeIcon
                css={`
                  opacity: ${opa1 - 0.4};
                `}
                icon={require('@fortawesome/pro-solid-svg-icons/faFolders').faFolders}
                transform={{ size: 15, x: 0, y: 0 }}
              />
            )}
            {isFile && (
              <FontAwesomeIcon
                css={`
                  opacity: ${opa1};
                `}
                icon={require('@fortawesome/pro-solid-svg-icons/faFile').faFile}
                transform={{ size: 15, x: 0, y: 0 }}
              />
            )}
          </span>
          <span
            css={`
              margin-left: 5px;
              ${isSelected ? `font-weigth: 600;` : `opacity: 0.8;`}
            `}
            className={sd.ellipsis}
          >
            {props.dataValue}
          </span>
        </div>
      </DropdownExt>
      {!isFile && isExpanded && (
        <div
          css={`
            margin-left: 8px;
            padding-left: 8px;
            border-left: 1px solid rgba(255, 255, 255, 0.15);
          `}
        >
          {subFoldersElem}
        </div>
      )}
    </>
  );
});

interface INBEditorTreeProps {
  isChanged?: boolean;
  isRefreshingTree?: boolean;
  forceRefreshTree?: () => void;
  callApi?: (method: ECallApiMethod, params?: ICallApiParams) => Promise<{ err?; res? }>;
  data?: ITreeItemNB;
  sel?: string[];
  onChangeSel?: (parentFoldersSub?: string[], value?: string, data?: any) => void;
  parentFolders?: string[];
}

const NBEditorTree = React.memo((props: PropsWithChildren<INBEditorTreeProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const [filter, setFilter] = useState('');
  const refItems = useRef(null);

  const topHH = 80;

  const pathCurrentElem = useMemo(() => {
    let res = [];

    res.push(
      <FontAwesomeIcon
        key={'icon_'}
        css={`
          opacity: ${opa1};
        `}
        icon={require('@fortawesome/pro-solid-svg-icons/faFolder').faFolder}
        transform={{ size: 15, x: 0, y: 0 }}
      />,
    );
    res.push(
      <span
        key={'icon_space_'}
        css={`
          margin-left: 4px;
        `}
      >
        /
      </span>,
    );

    return res;
  }, []);

  const onChangeFilter = (e) => {
    setFilter(e.target.value || '');
  };

  const filterDebounce = useDebounce(filter, 200);

  const onClickItem = (parentFoldersSub, value, data, e) => {
    props.onChangeSel?.(parentFoldersSub, value, data);
  };

  const listItems = useMemo(() => {
    let res = [];

    let kk = Object.keys(props.data ?? {}).sort();
    kk.some((k1, k1ind) => {
      let v1 = props.data?.[k1];
      const isFile = v1 === 'FILE';

      if (!Utils.isNullOrEmpty(filterDebounce)) {
        if (!Utils.searchIsTextInside(k1?.toLowerCase() || '', filterDebounce?.toLowerCase())) {
          return;
        }
      }

      res.push(
        <NBEditorTreeItem
          isChanged={props.isChanged}
          forceRefreshTree={props.forceRefreshTree}
          parentFolders={props.parentFolders}
          callApi={props.callApi}
          key={'item_tree_top_' + k1ind}
          sel={props.sel}
          dataValue={k1}
          data={v1}
          onClick={onClickItem}
        />,
      );
    });

    return res;
  }, [props.data, filterDebounce, props.isChanged, props.callApi, props.parentFolders, props.sel]);

  const createNBFilename = useRef('');

  const menuRoot = useMemo(() => {
    let popupContainerForMenu = (node) => document.getElementById('body2');

    const createFolderElem = (
      <div css={``}>
        <div css={``}>Folder Name:</div>
        <div css={``}>
          <Input
            defaultValue={'Folder1'}
            onChange={(e) => {
              createNBFilename.current = e.target.value;
            }}
          />
        </div>
      </div>
    );

    const createNBElem = (
      <div css={``}>
        <div css={``}>Notebook Filename:</div>
        <div css={``}>
          <Input
            defaultValue={'filename.ipynb'}
            onChange={(e) => {
              createNBFilename.current = e.target.value;
            }}
          />
        </div>
      </div>
    );

    const onConfirmPromise = (isFolder = false) => {
      return new Promise<boolean>((resolve) => {
        let fn1 = createNBFilename.current;
        if (Utils.isNullOrEmpty(fn1)) {
          REActions.addNotificationError(`Input is empty`);
        } else {
          let m1 = new NotebookModel({ languagePreference: 'python' });
          let contenNB = m1.toString();

          let path1 = calcPathFromArray(props.parentFolders) || '';
          if (!_.startsWith(path1, '/')) {
            path1 += '/';
          }
          path1 += fn1;

          let promise1 = null;
          if (isFolder) {
            promise1 = props.callApi?.(ECallApiMethod.createNotebookFolder, { folderPath: path1 });
          } else {
            promise1 = props.callApi?.(ECallApiMethod.createNotebookFile, { filePath: path1, fileContent: contenNB });
          }
          promise1
            ?.then((res) => {
              let isOk = res?.success === true;

              if (isOk) {
                props.forceRefreshTree?.();
              } else {
                REActions.addNotificationError(`${isFolder ? 'Folder' : 'File'} creation failed`);
              }

              resolve(isOk);
            })
            .catch((e) => {
              resolve(true);
              REActions.addNotificationError(`${isFolder ? 'Folder' : 'File'} creation failed`);
            });
        }
      });
    };

    return {
      // theme: 'dark',
      getPopupContainer: popupContainerForMenu,
      items: [
        {
          key: 'createFolder',
          label: (
            <ModalContent
              okType={'primary'}
              okText={'Create'}
              cancelText={'Cancel'}
              onConfirmPromise={onConfirmPromise.bind(null, true)}
              onClick={(e) => {
                createNBFilename.current = 'Folder1';
              }}
              title={'New Folder'}
              content={createFolderElem}
            >
              <div className={styles.contextMenuItem}>
                <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faFolderPlus').faFolderPlus} className={styles.menuIcon} /> New Folder
              </div>
            </ModalContent>
          ),
        },
        {
          key: 'createNB',
          label: (
            <ModalContent
              okType={'primary'}
              okText={'Create'}
              cancelText={'Cancel'}
              onConfirmPromise={onConfirmPromise.bind(null, false)}
              onClick={(e) => {
                createNBFilename.current = 'filename.ipynb';
              }}
              title={'Create New Notebook'}
              content={createNBElem}
            >
              <div className={styles.contextMenuItem}>
                <FontAwesomeIcon icon={require('@fortawesome/pro-solid-svg-icons/faFilePlus').faFilePlus} className={styles.menuIcon} /> New Notebook
              </div>
            </ModalContent>
          ),
        },
      ],
    } as MenuProps;
  }, [props.parentFolders]);

  const onClickRefreshTree = (e) => {
    props.forceRefreshTree?.();
  };

  return (
    <div className={classNames(sd.absolute, styles.NbExplorer)}>
      <div className={styles.searchFilter}>
        <Input value={filter} onChange={onChangeFilter} placeholder={`Filter file by name`} css={``} />
      </div>
      <div
        css={`
          font-size: 13px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding: 4px 9px 8px;
        `}
      >
        <span
          css={`
            margin-left: 4px;
            flex: 1;
          `}
        >
          {pathCurrentElem}
        </span>
        <span
          css={`
            margin-left: 6px;
            margin-right: 5px;
            cursor: pointer;
          `}
          onClick={onClickRefreshTree}
        >
          <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faSync').faSync} transform={{ size: 15, x: 0, y: 0 }} spin={props.isRefreshingTree === true} />
        </span>
      </div>
      <div
        css={`
          top: ${topHH + 10}px;
          bottom: 10px;
          left: 10px;
          right: 10px;
          font-size: 14px;
          font-family: Matter;
          line-height: 1.6;
        `}
        className={sd.absolute}
      >
        <DropdownExt overlayClassName="file-browser-context-menu" menu={menuRoot} trigger={['contextMenu']}>
          <div>
            <NanoScroller onlyVertical ref={refItems}>
              <div>{listItems}</div>
            </NanoScroller>
          </div>
        </DropdownExt>
      </div>
    </div>
  );
});

export default NBEditorTree;
