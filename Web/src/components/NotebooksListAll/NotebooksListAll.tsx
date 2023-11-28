import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import LinearProgress from '@mui/material/LinearProgress';
import Button from 'antd/lib/button';
import Input from 'antd/lib/input';
import Menu from 'antd/lib/menu';
import Radio, { RadioChangeEvent } from 'antd/lib/radio';
import * as _ from 'lodash';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Provider, useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import { NotebookLifecycle, NotebookLifecycleDesc } from '../../stores/reducers/notebooks';
import CopyText from '../CopyText/CopyText';
import CreateNotebookModal from '../CreateNotebookModal/CreateNotebookModal';
import DateOld from '../DateOld/DateOld';
import DropdownExt from '../DropdownExt/DropdownExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import ModalContent from '../ModalContent/ModalContent';
import PartsLink from '../NavLeft/PartsLink';
import NotebookModalAttach from '../NotebookModalAttach/NotebookModalAttach';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./NotebooksListAll.module.css');
const sd = require('../antdUseDark.module.css');

enum FilterOptions {
  all = 'all',
  my = 'my',
}

interface INotebooksListAllProps {}

const deleteChallenge = 'delete me';

const NotebooksListAll = React.memo((props: PropsWithChildren<INotebooksListAllProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));
  const [ignoredRefresh, forceUpdateRefresh] = useReducer((x) => x + 1, 0);
  const [list, setList] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [deleteButtonDisabled, setDeleteButtonDisabled] = useState(true);
  const [filterButtonValue, setFilterButtonValue] = useState(Utils.dataNum('notebooks_list_all_filter_button', 'all'));
  const [memoryOptions, setMemoryOptions] = useState(null);
  const [memoryOptionsGPU, setMemoryOptionsGPU] = useState(null);
  const [memoryDefault, setMemoryDefault] = useState(null);
  const [memoryDefaultGPU, setMemoryDefaultGPU] = useState(null);

  useEffect(() => {
    REClient_.client_()._getNotebookMemoryOptions((err, res) => {
      setMemoryOptions(res?.result?.cpu?.data);
      setMemoryOptionsGPU(res?.result?.gpu?.data);
      setMemoryDefault(res?.result?.cpu?.default);
      setMemoryDefaultGPU(res?.result?.gpu?.default);
    });
  }, []);

  const userEmail = authUser?.getIn(['data', 'email']);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '' || projectId === '-') {
    projectId = null;
  }

  const notebookUpdated = () => {
    forceUpdateRefresh();
  };

  useEffect(() => {
    let unR = REActions.notebookUpdated.listen(notebookUpdated);
    return () => {
      unR();
    };
  }, []);

  useEffect(() => {
    let a1 = ignoredRefresh;
    if (a1 > 0) {
      setIsRefreshing(true);
    }
    REClient_.client_()._listNotebooks(projectId, (err, res) => {
      if (a1 > 0) {
        setIsRefreshing(false);
      }
      setList(res?.result);
    });
  }, [ignoredRefresh, projectId]);

  const onClickStopNB = (notebookId, e) => {
    if (e && e.domEvent) {
      e.domEvent.stopPropagation();
    }
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    if (notebookId) {
      REActions.addNotification('Stopping notebook...');

      REClient_.client_()._stopNotebook(notebookId, (err, res) => {
        if (err) {
          REActions.addNotificationError('Error: ' + err);
        } else {
          REActions.addNotification('Stopping!');

          StoreActions.refreshDoNotebookAll_(notebookId, () => {
            forceUpdateRefresh();
          });
          forceUpdateRefresh();
        }
      });
    }
  };

  const onClickStartNB = (notebookId, e) => {
    if (e && e.domEvent) {
      e.domEvent.stopPropagation();
    }
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    if (notebookId) {
      REActions.addNotification('Starting notebook...');

      REClient_.client_()._startNotebook(notebookId, (err, res) => {
        if (err) {
          REActions.addNotificationError('Error: ' + err);
        } else {
          REActions.addNotification('Notebook Service starting');

          StoreActions.refreshDoNotebookAll_(notebookId, () => {
            forceUpdateRefresh();
          });
          forceUpdateRefresh();
        }
      });
    }
  };

  const onClickDeleteNB = (notebookId, e) => {
    if (e && e.domEvent) {
      e.domEvent.stopPropagation();
    }
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    setDeleteButtonDisabled(true);
    if (notebookId) {
      REActions.addNotification('Deleting notebook...');

      REClient_.client_()._deleteNotebook(notebookId, (err, res) => {
        if (err) {
          REActions.addNotificationError('Error: ' + err);
        } else {
          REActions.addNotification('Deleted!');

          StoreActions.refreshDoNotebookAll_(notebookId, () => {
            forceUpdateRefresh();
          });
          forceUpdateRefresh();
        }
      });
    }
  };

  const onClickDetails = (notebookId, e) => {
    if (e && e.domEvent) {
      e.domEvent.stopPropagation();
    }
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    Location.push('/' + PartsLink.notebook_details + '/' + (projectId ?? '-') + '/' + notebookId);
  };

  const renameRef = useRef(null);
  const onClickRename = (notebookId, e) => {
    return new Promise<boolean>((resolve) => {
      if (Utils.isNullOrEmpty(renameRef.current)) {
        resolve(true);
        return;
      }

      REClient_.client_()._renameNotebook(notebookId, renameRef.current, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
          resolve(false);
        } else {
          StoreActions.describeNotebook_(notebookId);
          forceUpdateRefresh();
          resolve(true);
        }
      });
    });
  };

  const onClickSetUseGpu = (notebookId, useGpu, e) => {
    return new Promise<boolean>((resolve) => {
      REClient_.client_()._setNotebookUsesGpu(notebookId, useGpu, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
          resolve(false);
        } else {
          StoreActions.describeNotebook_(notebookId);
          forceUpdateRefresh();
          resolve(true);

          REActions.addNotification('Notebook Restart Is Needed', 'warning', undefined, false);
        }
      });
    });
  };

  const memoryRef = useRef(null);
  const onClickSetMemory = (notebookId, e) => {
    return new Promise<boolean>((resolve) => {
      REClient_.client_()._setNotebookMemory(notebookId, memoryRef.current, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
          resolve(false);
        } else {
          StoreActions.describeNotebook_(notebookId);
          forceUpdateRefresh();
          resolve(true);

          REActions.addNotification('Notebook Restart Is Needed', 'warning', undefined, false);
        }
      });
    });
  };

  const columns = useMemo(() => {
    return [
      {
        title: 'Name',
        field: 'name',
        isLinked: true,
        render: (text, row) => (
          <Link to={`/${row.isScratch ? PartsLink.fast_notebook : PartsLink.notebook_one}/${projectId ?? '-'}/${row.notebookId}`} forceSpanUse usePointer showAsLink>
            {text}
          </Link>
        ),
      },
      {
        title: 'Last Started At',
        field: 'startedAt',
        render: (text) => {
          return text == null ? '-' : <DateOld always date={text} />;
        },
      },
      {
        title: 'Memory',
        field: 'memory',
        render: (text, row) => {
          return <span>{text ?? '-'} GB</span>;
        },
        width: 120,
      },
      {
        title: 'GPU Enabled',
        field: 'gpuEnabled',
        render: (text, row) => {
          return <span>{text ? 'Yes' : 'No'}</span>;
        },
        width: 120,
      },
      {
        title: 'Projects',
        field: 'projectIds',
        render: (ele, row) => {
          if (row.projectIds) {
            return row.projectIds.map((text, ind) => {
              return (
                <span key={'p' + text}>
                  {ind > 0 ? <span> </span> : null}
                  <Link to={'/' + PartsLink.project_dashboard + '/' + text} forceSpanUse usePointer showAsLink>
                    <CopyText>{text}</CopyText>
                  </Link>
                </span>
              );
            });
          }
        },
        hidden: projectId != null,
      },
      {
        title: 'Created By',
        field: 'createdBy',
        render: (text, row) => {
          return <span>{text ?? 'Removed User'}</span>;
        },
      },
      {
        title: 'Status',
        field: 'status',
        render: (text, row) => {
          let isTraining = row.notebookId && StoreActions.refreshNotebookUntilStateIsTraining_(row.notebookId);

          if (!isTraining && [NotebookLifecycle.DEPLOYING, NotebookLifecycle.INITIALIZING, NotebookLifecycle.SAVING, NotebookLifecycle.STOPPING].includes(row.status || '')) {
            StoreActions.refreshDoNotebookAll_(row.notebookId);
            isTraining = true;
          }

          if (isTraining) {
            return (
              <span>
                <div style={{ whiteSpace: 'nowrap' }}>{'Processing'}...</div>
                <div style={{ marginTop: '5px' }}>
                  <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
                </div>
              </span>
            );
          } else {
            let res = <span style={{ whiteSpace: 'nowrap' }}>{NotebookLifecycleDesc[text] ?? Utils.upperFirst(text)}</span>;
            if (
              [NotebookLifecycle.SAVING_FAILED.toLowerCase(), NotebookLifecycle.FAILED.toLowerCase(), NotebookLifecycle.INITIALIZING_FAILED.toLowerCase(), NotebookLifecycle.SAVING_FAILED.toLowerCase()].includes(
                (row.status || '').toLowerCase(),
              )
            ) {
              res = <span className={sd.red}>{res}</span>;
            }
            return res;
          }
        },
      },
      {
        title: 'Actions',
        render: (text, row) => {
          let popupContainerForMenu = (node) => document.getElementById('body2');

          const refreshNBs = () => {
            forceUpdateRefresh();
          };

          let gpuEnabled = row.gpuEnabled;

          memoryRef.current = row.memory ?? (gpuEnabled ? memoryDefaultGPU : memoryDefault);
          let memUsed = memoryRef.current;

          let options1 = gpuEnabled ? memoryOptionsGPU : memoryOptions;
          let om1 = options1?.find((o1) => o1.value === memUsed);
          if (om1 == null) {
            memUsed = { label: '' + memUsed + ' GB', value: memUsed };
          } else {
            memUsed = om1;
          }

          renameRef.current = null;

          const memoryElem = (
            <div key={'dd2_' + row.name} css={``} className={'useDark'}>
              <div
                css={`
                  font-size: 15px;
                  margin-bottom: 20px;
                `}
              >
                Set Memory Usage:
              </div>
              <div css={``}>
                <span
                  css={`
                    width: 100px;
                  `}
                >
                  <SelectExt
                    options={options1}
                    key={'dd_' + row.name}
                    defaultValue={memUsed}
                    onChange={(o1) => {
                      memoryRef.current = o1?.value;
                    }}
                  />
                </span>
              </div>
            </div>
          );

          const renameElem = (
            <div css={``} className={'useDark'}>
              <div
                css={`
                  font-size: 15px;
                  margin-bottom: 20px;
                `}
              >
                Rename Notebook:
              </div>
              <div css={``}>
                <Input
                  defaultValue={row.name}
                  onChange={(e) => {
                    renameRef.current = e.target.value;
                  }}
                />
              </div>
            </div>
          );

          const menu = (
            <Menu getPopupContainer={popupContainerForMenu}>
              {!Constants.flags.onprem && [NotebookLifecycle.SAVING_FAILED, NotebookLifecycle.DEPLOYING_FAILED, NotebookLifecycle.INITIALIZING_FAILED, NotebookLifecycle.FAILED, NotebookLifecycle.STOPPED].includes(row?.status) && (
                <Menu.Item key="1" onClick={onClickStartNB.bind(null, row.notebookId)}>
                  Start
                </Menu.Item>
              )}
              {!Constants.flags.onprem && [NotebookLifecycle.ACTIVE].includes(row?.status) && (
                <Menu.Item key="2" onClick={onClickStopNB.bind(null, row.notebookId)}>
                  Stop
                </Menu.Item>
              )}
              {
                <Menu.Item key="8ren">
                  <ModalConfirm onConfirmPromise={onClickRename.bind(null, row.notebookId)} title={renameElem} icon={<QuestionCircleOutlined style={{ color: 'darkgreen' }} />} okText={'Rename'} cancelText={'Cancel'} okType={'primary'}>
                    <div style={{ margin: '-6px -12px', padding: '6px 12px' }}>Rename...</div>
                  </ModalConfirm>
                </Menu.Item>
              }
              <Menu.Item key="4" onClick={onClickDetails.bind(null, row.notebookId)}>
                Details
              </Menu.Item>
              {!Constants.flags.onprem && (
                <Menu.Item key="3">
                  <ModalConfirm onConfirmPromise={onClickSetMemory.bind(null, row.notebookId)} title={memoryElem} icon={<QuestionCircleOutlined style={{ color: 'darkgreen' }} />} okText={'Set'} cancelText={'Cancel'} okType={'primary'}>
                    <div style={{ margin: '-6px -12px', padding: '6px 12px' }}>Set Memory Usage</div>
                  </ModalConfirm>
                </Menu.Item>
              )}
              {!Constants.flags.onprem && (
                <Menu.Item key="7gpu">
                  <ModalConfirm
                    onConfirmPromise={onClickSetUseGpu.bind(null, row.notebookId, !row.gpuEnabled)}
                    title={`Do you want to ${row.gpuEnabled ? 'Disable GPU' : 'Enable GPU'}?`}
                    icon={<QuestionCircleOutlined style={{ color: 'darkgreen' }} />}
                    okText={row.gpuEnabled ? 'Disable' : 'Enable'}
                    cancelText={'Cancel'}
                    okType={'primary'}
                  >
                    <div style={{ margin: '-6px -12px', padding: '6px 12px' }}>{row.gpuEnabled ? 'Disable GPU' : 'Enable GPU'}</div>
                  </ModalConfirm>
                </Menu.Item>
              )}
              <Menu.Divider />
              {projectId != null && (
                <Menu.Item key={'4'}>
                  <NotebookModalAttach notebookId={row.notebookId} forMenu isDetach detachFromProjectId={projectId} onDetach={refreshNBs} />
                </Menu.Item>
              )}
              {
                <Menu.Item key="5">
                  <NotebookModalAttach notebookId={row.notebookId} excludeProjectId={projectId} forMenu onAttach={refreshNBs} />
                </Menu.Item>
              }
              <Menu.Divider />
              {
                <Menu.Item key="6">
                  <ModalContent
                    onConfirm={(e) => onClickDeleteNB(row.notebookId, e)}
                    onCancel={() => setDeleteButtonDisabled(true)}
                    title={`Are you sure you want to delete this notebook: '${row.name}'?`}
                    icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                    okText="Delete"
                    okButtonProps={{ disabled: deleteButtonDisabled }}
                    cancelText="Cancel"
                    okType="danger"
                    content={
                      <div>
                        <div>{`Notebook name: "${row.name}"`}</div>
                        <div>{`Write "${deleteChallenge}" inside the box to confirm`}</div>
                        <Input style={{ marginTop: '8px', color: 'red' }} placeholder={deleteChallenge} onChange={(e) => setDeleteButtonDisabled(e.target.value !== deleteChallenge)} />
                      </div>
                    }
                  >
                    <div style={{ margin: '-6px -12px', padding: '6px 12px', color: 'red' }}>Delete</div>
                  </ModalContent>
                </Menu.Item>
              }
            </Menu>
          );

          const onClickCancelEvents = (e) => {
            // e.preventDefault();
            e.stopPropagation();
          };

          return (
            <span>
              <DropdownExt overlay={menu} trigger={['click']}>
                <Button ghost type={'default'} onClick={onClickCancelEvents}>
                  Actions
                </Button>
              </DropdownExt>
            </span>
          );
        },
        width: 160,
      },
    ].filter((v1) => !v1.hidden) as ITableExtColumn[];
  }, [memoryOptions, deleteButtonDisabled]);

  const calcLink = useCallback((row) => '/' + `${row.isScratch ? PartsLink.fast_notebook : PartsLink.notebook_one}` + '/' + (projectId ?? '-') + '/' + row?.notebookId, []);

  const calcKey = useCallback((r1) => r1.notebookId, []);

  const onClickAddNew = (e) => {
    return new Promise<boolean>((resolve) => {
      REClient_.client_()._createNotebook(createNBValues.current?.name, projectId, createNBValues.current?.memory, createNBValues.current?.useGpu, (err, res) => {
        let notebookId = res?.result?.notebookId;
        if (err || notebookId == null) {
          REActions.addNotificationError(err || Constants.errorDefault);
          resolve(false);
        } else {
          resolve(true);

          const doEndWork = () => {
            Location.push('/' + PartsLink.notebook_one + '/' + (projectId ?? '-') + '/' + notebookId);
          };

          if (createNBValues.current?.memory == null) {
            doEndWork();
          } else {
            REClient_.client_()._setNotebookMemory(notebookId, createNBValues.current?.memory, (err, res) => {
              doEndWork();
            });
          }
        }
      });
    });
  };

  const updateFilterSelection = (value: FilterOptions) => {
    switch (value) {
      case FilterOptions.my:
        setFilterText(userEmail);
        setFilterButtonValue(FilterOptions.my);
        Utils.dataNum('notebooks_list_all_filter_button', undefined, FilterOptions.my);
        break;
      case FilterOptions.all:
      default:
        setFilterText('');
        setFilterButtonValue(FilterOptions.all);
        Utils.dataNum('notebooks_list_all_filter_button', undefined, FilterOptions.all);
        break;
    }
  };

  const handleChangeButton = (e?: RadioChangeEvent) => {
    updateFilterSelection(e.target.value);
  };

  const onChangeFilterText = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFilterText(e.target.value || '');
  };

  useEffect(() => {
    updateFilterSelection(filterButtonValue);
  }, [filterButtonValue, userEmail]);

  const listFiltered = useMemo(() => {
    let fs = _.trim(filterText || '').toLowerCase();
    if (fs === '' || fs == null) {
      return list;
    } else {
      return list?.filter(
        (o1) => Utils.searchIsTextInside(o1?.createdBy?.toLowerCase(), fs) || Utils.searchIsTextInside(o1.name?.toLowerCase(), fs) || (Utils.searchIsTextInside(o1.projectId?.toLowerCase(), fs) && fs?.length > 4 && fs?.indexOf(' ') === -1),
      );
    }
  }, [list, filterText, filterButtonValue]);

  const onClickFilterTextClear = (e: React.MouseEvent<HTMLButtonElement>): void => {
    setFilterText('');
  };

  const createNBValues = useRef({} as any);

  const onClickCreateNB = (e) => {
    createNBValues.current = {};
  };

  return (
    <div className={sd.absolute + ' ' + sd.table} style={_.assign({ margin: '25px' }, { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }) as CSSProperties}>
      <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
        <div
          css={`
            display: flex;
            align-items: center;
          `}
        >
          <span>
            Notebooks
            <HelpIcon id={'notebooksall_title' + (projectId == null ? '_org' : '')} style={{ marginLeft: '4px' }} />
          </span>
          <Input style={{ marginLeft: '20px', width: '240px', verticalAlign: 'top', marginTop: '4px' }} placeholder={'Filter Notebooks'} value={filterText ?? ''} onChange={onChangeFilterText} />
          <Button className={sd.detailbuttonblueBorder} ghost style={{ marginTop: '1px', height: '30px', marginLeft: '5px' }} type={'primary'} onClick={onClickFilterTextClear}>
            Clear
          </Button>
          <Radio.Group onChange={handleChangeButton} defaultValue={filterButtonValue} buttonStyle="solid" className={s.groupList}>
            <Radio.Button value="all" style={{ boxShadow: 'none' }}>
              All Notebooks
            </Radio.Button>
            <Radio.Button value="my" style={{ boxShadow: 'none' }}>
              My Notebooks
            </Radio.Button>
          </Radio.Group>
          <span
            css={`
              flex: 1;
            `}
          ></span>
          <span>
            {false && projectId == null && (
              <Button type={'primary'} onClick={onClickAddNew}>
                Create Notebook Project
              </Button>
            )}
            {
              <ModalConfirm
                width={480}
                onClick={onClickCreateNB}
                onConfirmPromise={onClickAddNew}
                title={
                  <Provider store={Utils.globalStore()}>
                    <CreateNotebookModal
                      onChange={(v1) => {
                        createNBValues.current = _.assign({}, createNBValues.current ?? {}, v1 ?? {});
                      }}
                    />
                  </Provider>
                }
                icon={<QuestionCircleOutlined style={{ color: 'darkgreen' }} />}
                okText={'Create'}
                cancelText={'Cancel'}
                okType={'primary'}
              >
                <Button type={'primary'}>Create Notebook</Button>
              </ModalConfirm>
            }
          </span>
        </div>
      </div>
      <AutoSizer disableWidth>
        {({ height }) => {
          let hh = height - topAfterHeaderHH;

          return (
            <RefreshAndProgress isRefreshing={isRefreshing} style={hh == null ? {} : { top: topAfterHeaderHH + 'px' }}>
              <TableExt isVirtual showEmptyIcon defaultSort={{ field: 'startedAt', isAsc: false }} height={hh} dataSource={listFiltered} columns={columns} calcKey={calcKey} calcLink={calcLink} />
            </RefreshAndProgress>
          );
        }}
      </AutoSizer>
      ;
    </div>
  );
});

export default NotebooksListAll;
