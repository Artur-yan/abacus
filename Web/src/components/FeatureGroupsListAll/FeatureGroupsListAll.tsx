import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Input from 'antd/lib/input';
import Menu from 'antd/lib/menu';
import confirm from 'antd/lib/modal/confirm';
import LinearProgress from '@mui/material/LinearProgress';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as _ from 'lodash';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import StoreActions from '../../stores/actions/StoreActions';
import featureGroups, { FeatureGroupVersionLifecycle } from '../../stores/reducers/featureGroups';
import { memProjectById } from '../../stores/reducers/projects';
import CopyText from '../CopyText/CopyText';
import DateOld from '../DateOld/DateOld';
import DropdownExt from '../DropdownExt/DropdownExt';
import { FGLangType } from '../FeatureGroups/FGLangType';
import HelpIcon from '../HelpIcon/HelpIcon';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import StarredSpan from '../StarredSpan/StarredSpan';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./FeatureGroupsListAll.module.css');
const sd = require('../antdUseDark.module.css');

interface IFeatureGroupsListAllProps {}

const topHHExtra = 40;

const FeatureGroupsListAll = React.memo((props: PropsWithChildren<IFeatureGroupsListAllProps>) => {
  const { paramsProp, authUser, featureGroupsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    featureGroupsParam: state.featureGroups,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [ignoredRefresh, forceUpdateRefresh] = useReducer((x) => x + 1, 0);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastId, setLastId] = useState(null);
  const [lastIdMore, setLastIdMore] = useState(null);
  const [notMore, setNotMore] = useState(false);
  const [dataList, setDataList] = useState(null);
  const [isRefreshingMore, setIsRefreshingMore] = useState(false);
  const confirmUsed = useRef(null);
  const [onlyStarred, setOnlyStarred] = useState(paramsProp?.get('starred') === '1');

  const filterInParamUsed = useRef(null);
  let filterInParam = paramsProp?.get('filter');
  if (_.trim(filterInParam || '') === '') {
    filterInParam = null;
  }

  const [filterText, setFilterText] = useState(filterInParam ?? '');
  const [filterType, setFilterType] = useState(null);

  useEffect(() => {
    featureGroups.memFeatureGroupTypes(true);
  }, [featureGroupsParam]);
  const fgTypesList = useMemo(() => {
    return featureGroups.memFeatureGroupTypes(false);
  }, [featureGroupsParam]);
  const optionsFGTypes = useMemo(() => {
    let res = fgTypesList?.map((r1) => ({ label: r1.label, value: r1.name, data: r1 }));
    res = res ?? [];
    res.unshift({ label: 'All', value: null, data: null });
    return res;
  }, [fgTypesList]);

  const onChangeFilterText = (e) => {
    setFilterText(e.target.value);
  };

  const onKeyDownFilterText = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onClickFilterText(e);
    }
  };

  const refreshList = () => {
    setLastId(null);
    setLastIdMore(null);
    setNotMore(false);
    setDataList(null);

    setTimeout(() => {
      forceUpdateRefresh();
    }, 0);
  };

  const onClickFilterText = (e) => {
    setFilterText((s1) => {
      const v1 = _.trim(s1 || '');
      if ((paramsProp?.get('filter') ?? '') !== v1) {
        setTimeout(() => {
          Location.push('/' + paramsProp?.get('mode'), undefined, Utils.processParamsAsQuery({ filter: v1 }, window.location.search));

          setTimeout(() => {
            refreshList();
          }, 0);
        }, 0);
      }

      return s1;
    });
  };

  const onClickFilterTextClear = (e) => {
    setFilterText('');
    onClickFilterText(e);
  };

  const calcKeyTable = useCallback((row) => {
    return row?.featureGroupId;
  }, []);

  const calcLinkTable = useCallback((row) => {
    return '/' + PartsLink.feature_group_detail + '/-/' + row.featureGroupId;
  }, []);

  const lastIdUsed = lastId == null ? null : lastId;

  useEffect(() => {
    const max = 30;

    filterInParamUsed.current = filterInParam;

    setIsRefreshingMore(true);
    setOnlyStarred((os1) => {
      REClient_.client_()._listFeatureGroupsDashboard(filterType, max, lastIdUsed, filterInParam, os1 === true ? true : null, (err, res) => {
        setIsRefreshingMore(false);
        setDataList((list) => {
          const newList = res?.result;
          if (newList == null || newList?.length === 0) {
            if (lastIdUsed == null) {
              list = [];
            }
            setNotMore(true);
          } else {
            list = [...(list ?? [])];
            if (lastIdUsed == null) {
              list = [];
            }

            list = list.concat(newList);

            let d1 = newList?.[newList.length - 1];
            setLastIdMore(d1?.featureGroupId);
          }

          return list;
        });
      });

      return os1;
    });
  }, [lastIdUsed, ignoredRefresh]);

  const onClickVoid = (event) => {
    if (event && event.domEvent) {
      event.domEvent.stopPropagation();
    }
  };

  const onClickCancelEvents = (e) => {
    // e.preventDefault();
    e.stopPropagation();
  };

  const onClickRenameFeatureGroup = (featureGroupId, featureGroupName, param1) => {
    let editNameValue = featureGroupName;

    if (confirmUsed.current != null) {
      confirmUsed.current.destroy();
      confirmUsed.current = null;
    }

    confirmUsed.current = confirm({
      title: 'Rename Feature Group',
      okText: 'Rename',
      cancelText: 'Cancel',
      maskClosable: true,
      content: (
        <div>
          <div>{'Current Name: "' + featureGroupName + '"'}</div>
          <Input
            style={{ marginTop: '8px' }}
            placeholder={featureGroupName}
            defaultValue={featureGroupName}
            onChange={(e) => {
              editNameValue = e.target.value;
            }}
          />
        </div>
      ),
      onOk: () => {
        if (editNameValue != featureGroupName) {
          //delete it
          REActions.addNotification('Renaming feature group to "' + editNameValue + '"');

          REClient_.client_().updateFeatureGroup(featureGroupId, editNameValue, null, null, (err, res) => {
            if (err) {
              REActions.addNotificationError(err);
            } else {
              REActions.addNotification('Feature Group Renamed!');

              let r1 = featureGroups.memFeatureGroupsForId(false, null, featureGroupId);
              if (r1 != null) {
                StoreActions.featureGroupsDescribe_(null, featureGroupId);
              }

              REClient_.client_()._getFeatureGroupProjects(featureGroupId, (err, res) => {
                let ids = res?.result;
                if (ids != null && _.isArray(ids)) {
                  ids.some((id1) => {
                    let p1 = memProjectById(id1, false);
                    if (p1 != null) {
                      StoreActions.getProjectsById_(id1);
                      StoreActions.getProjectDatasets_(id1, (res, ids) => {
                        StoreActions.listDatasets_(ids);
                      });
                      StoreActions.featureGroupsGetByProject_(id1);
                    }

                    let r1 = featureGroups.memFeatureGroupsForId(false, id1, featureGroupId);
                    if (r1 != null) {
                      REClient_.client_().listBatchPredictions(id1, null, (err, res) => {
                        let ids = res?.result?.map((r1) => r1?.batchPredictionId)?.filter((v1) => !Utils.isNullOrEmpty(v1));
                        if (ids != null && ids.length > 0) {
                          ids.some((id1) => {
                            StoreActions.batchDescribeById_(id1);
                          });
                        }
                      });

                      StoreActions.featureExportsList_(featureGroupId);
                      StoreActions.featureGroupsDescribe_(id1, featureGroupId);
                    }
                  });
                }
              });

              refreshList();
            }
          });
        }
      },
      onCancel: () => {
        //
      },
    });
  };

  const onClickDeleteFeatureGroup = (featureGroup) => {
    const featureGroupId = featureGroup.featureGroupId;
    const featureGroupName = featureGroup.name;
    const projects = featureGroup.projects?.map((p1) => p1?.projectId);
    const referencedFeatureGroups = featureGroup?.referencedFeatureGroups || [];
    let writeDeleteMeConfirm = '';

    if (confirmUsed.current != null) {
      confirmUsed.current.destroy();
      confirmUsed.current = null;
    }

    if (referencedFeatureGroups?.length) {
      const [first, ...rest] = referencedFeatureGroups;
      let referencedFeatureGroupsString = `${first} feature group`;
      let subMessage = 'Remove this dependency before deleting.';
      if (rest.length) {
        referencedFeatureGroupsString = `${rest.join(',')} and ${first} feature groups`;
        subMessage = 'Remove these dependencies before deleting.';
      }
      confirmUsed.current = confirm({
        title: 'Cannot delete this feature group',
        cancelText: 'Ok',
        okButtonProps: { style: { display: 'none' } },
        maskClosable: true,
        content: (
          <div>
            <div>This feature group is being referenced in {referencedFeatureGroupsString}.</div>
            <div>{subMessage}</div>
          </div>
        ),
      });
      return;
    }

    confirmUsed.current = confirm({
      title: 'Are you sure you want to delete this feature group?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      maskClosable: true,
      content: (
        <div>
          <div>This will permanently delete this feature group, and make any dependent feature groups invalid.</div>
          <div>{'Feature Group: "' + featureGroupName + '"'}</div>
          <div>{projects ? 'Used in Projects: ' + projects.join(', ') : 'This feature group is not used in any projects'}</div>
          <div style={{}}>Write {'"delete me"'} inside the box to confirm</div>
          <Input
            style={{ marginTop: '8px', color: 'red' }}
            placeholder={'delete me'}
            defaultValue={''}
            onChange={(e) => {
              writeDeleteMeConfirm = e.target.value;
            }}
          />
        </div>
      ),
      onOk: () => {
        if (writeDeleteMeConfirm === 'delete me') {
          //delete it
          REActions.addNotification('Deleting feature group...');

          REClient_.client_().deleteFeatureGroup(featureGroupId, (err, res) => {
            if (err) {
              REActions.addNotificationError(err);
            } else {
              REActions.addNotification('Feature Group Deleted!');

              let r1 = featureGroups.memFeatureGroupsForId(false, null, featureGroupId);
              if (r1 != null) {
                StoreActions.featureGroupsDescribe_(null, featureGroupId);
              }

              REClient_.client_()._getFeatureGroupProjects(featureGroupId, (err, res) => {
                let ids = res?.result;
                if (ids != null && _.isArray(ids)) {
                  ids.some((id1) => {
                    let r1 = featureGroups.memFeatureGroupsForId(false, id1, featureGroupId);
                    if (r1 != null) {
                      REClient_.client_().listBatchPredictions(id1, null, (err, res) => {
                        let ids = res?.result?.map((r1) => r1?.batchPredictionId)?.filter((v1) => !Utils.isNullOrEmpty(v1));
                        if (ids != null && ids.length > 0) {
                          ids.some((id1) => {
                            StoreActions.batchDescribeById_(id1);
                          });
                        }
                      });

                      StoreActions.featureGroupsDescribe_(id1, featureGroupId);
                    }
                  });
                }
              });

              refreshList();
            }
          });
        } else {
          REActions.addNotificationError('You need to write "delete me" to delete the feature group');
          onClickDeleteFeatureGroup(featureGroup);
        }
      },
      onCancel: () => {
        //
      },
    });
  };

  useEffect(() => {
    return () => {
      if (confirmUsed.current != null) {
        confirmUsed.current.destroy();
        confirmUsed.current = null;
      }
    };
  }, []);

  const onClickStarred = (featureGroupId, isStarred, e) => {
    REClient_.client_()._starFeatureGroup(featureGroupId, isStarred, (err, res) => {
      StoreActions.featureGroupsDescribe_(null, featureGroupId, (res) => {
        let pIds = res?.projects?.map((p1) => p1?.projectId);
        if (pIds && pIds.length > 0) {
          pIds.some((id1) => {
            StoreActions.featureGroupsDescribe_(id1, featureGroupId);
          });
        }
      });

      setOnlyStarred((os1) => {
        setDataList((list) => {
          list = [...(list ?? [])];
          list.some((f1, f1ind) => {
            if (f1?.featureGroupId === featureGroupId) {
              if (os1 && !isStarred) {
                list.splice(f1ind, 1);
              } else {
                f1.starred = isStarred === true;
              }
              return true;
            }
          });

          return list;
        });

        return os1;
      });
    });
  };

  const columns = useMemo(() => {
    return [
      {
        title: '',
        field: 'starred',
        helpId: '',
        noAutoTooltip: true,
        render: (starred, row, index) => {
          return <StarredSpan name={'Feature Group'} isStarred={!!row.starred} onClick={onClickStarred.bind(null, row.featureGroupId)} />;
        },
        width: 45,
      },
      {
        title: 'Feature Group ID',
        field: 'featureGroupId',
        render: (text, row, index) => {
          return (
            <span>
              <CopyText>{text}</CopyText>
            </span>
          );
        },
        isLinked: true,
        width: 130,
      },
      {
        title: 'Created At',
        field: 'createdAt',
        render: (text, row, index) => {
          return text == null ? '-' : <DateOld always date={text} />;
        },
        width: 230,
      },
      {
        title: 'Table Name',
        field: 'tableName',
        isValueTrunacted: true,
        render: (text, row, index) => {
          return (
            <span>
              <CopyText noNoWrap={true} isValueTrunacted={true}>
                {text}
              </CopyText>
            </span>
          );
        },
      },
      {
        title: 'Source Type',
        field: 'featureGroupSourceType',
      },
      {
        title: 'Source Tables',
        isValueTrunacted: true,
        render: (text, row, index) => {
          let pp = row.sourceTables;
          return (
            <span>
              {pp?.map((s1, s1ind) => (
                <span key={'aa_' + s1ind}>
                  {s1ind > 0 ? <span>, </span> : null}
                  <CopyText noNoWrap={true} isValueTrunacted={true}>
                    {s1}
                  </CopyText>
                </span>
              ))}
            </span>
          );
        },
      },
      {
        title: 'Status',
        field: 'latestFeatureGroupVersion',
        helpId: 'fg_detail_table_header_status_2',
        render: (text, row, index) => {
          var status = text?.status || 'Not materialized yet';
          if ([FeatureGroupVersionLifecycle.PENDING, FeatureGroupVersionLifecycle.GENERATING].includes(status)) {
            return (
              <span>
                <div style={{ whiteSpace: 'nowrap' }}>{Utils.upperFirst(status)}...</div>
                <div style={{ marginTop: '5px' }}>
                  <LinearProgress style={{ backgroundColor: 'transparent', height: '6px' }} />
                </div>
              </span>
            );
          }
          let res = <span style={{ whiteSpace: 'nowrap' }}>{Utils.upperFirst(status)}</span>;
          if (FeatureGroupVersionLifecycle.FAILED === status) {
            res = (
              <div>
                <span className={sd.red}>{res}</span>
                {text?.error ? (
                  <TooltipExt placement="bottom" overlay={<span style={{ whiteSpace: 'pre-wrap' }}>{text.error}</span>}>
                    <FontAwesomeIcon icon={['far', 'exclamation-circle']} transform={{ size: 15, x: -4 }} style={{ opacity: 0.7, color: 'red', marginLeft: '6px' }} />
                  </TooltipExt>
                ) : null}
              </div>
            );
          }
          return res;
        },
        width: 180,
      },
      // {
      //   title: 'Source Tables',
      //   field: 'sourceTables',
      //   render: (text, row, index) => {
      //     if(!_.isArray(text)) {
      //       if(_.isObject(text)) {
      //         text = null;
      //       } else {
      //         text = [text];
      //       }
      //     }
      //     return <span>{text?.map((v1, v1ind) => (<span key={'tt'+v1ind}>{v1ind>0 && <span>,&nbsp;</span>}{v1}</span>))}</span>;
      //   },
      //   width: 280,
      // },
      // {
      //   title: 'Project Use Type',
      //   field: 'projectFeatureGroupType',
      //   render: (text, row, index) => {
      //     return <span>{optionsFGTypes?.find(o1 => o1.value===text)?.label}</span>;
      //   },
      // },
      {
        title: 'Tags',
        field: 'tags',
        render: (text, row, index) => {
          text = row.tags;
          if (!_.isArray(text)) {
            if (_.isObject(text)) {
              text = null;
            } else {
              text = [text];
            }
          }
          return (
            <span>
              {text?.map((v1, v1ind) => (
                <span key={'tt' + v1ind}>
                  {v1ind > 0 && <span>,&nbsp;</span>}
                  {v1}
                </span>
              ))}
            </span>
          );
        },
      },
      {
        noAutoTooltip: true,
        field: 'actions',
        width: '116px',
        render: (text, row, index) => {
          let popupContainerForMenu = (node) => document.getElementById('body2');
          const menu = (
            <Menu onClick={onClickVoid} getPopupContainer={popupContainerForMenu}>
              {/*<Menu.Item onClick={onClickRenameFeatureGroup.bind(null, row.featureGroupId, row.name)} style={{ color: 'black', }}>Rename</Menu.Item>*/}
              <Menu.Item onClick={onClickDeleteFeatureGroup.bind(null, row)} style={{ color: 'red' }}>
                Delete Feature Group
              </Menu.Item>
            </Menu>
          );

          const styleButton: CSSProperties = { marginLeft: '8px', marginBottom: '8px' };

          let res = (
            <DropdownExt overlay={menu} trigger={['click']}>
              <Button style={styleButton} ghost type={'default'} onClick={onClickCancelEvents}>
                Actions
              </Button>
            </DropdownExt>
          );
          return res;
        },
      },
    ] as ITableExtColumn[];
  }, [optionsFGTypes]);

  const remoteRowCount = useMemo(() => {
    let res = dataList?.length ?? 0;
    if (!notMore && res > 0) {
      res++;
    }
    return res;
  }, [dataList, notMore]);

  const onNeedMore = () => {
    setIsRefreshingMore((isR) => {
      if (!isR) {
        setLastIdMore((id1) => {
          setLastId(id1);
          return id1;
        });
      }

      return isR;
    });
  };

  const onChangeFilterType = (option1) => {
    setFilterType(option1?.value ?? null);

    setTimeout(() => {
      refreshList();
    }, 0);
  };

  const onClickAddFeatureGroup = (type: FGLangType, e) => {
    if (type === FGLangType.Python) {
      Location.push('/' + PartsLink.feature_groups_add + '/-', undefined, 'fromFeatureGroupList=1&useType=' + encodeURIComponent(type));
    } else {
      Location.push('/' + PartsLink.feature_groups_add + '/-', undefined, 'useType=' + encodeURIComponent(type));
    }
  };

  const menuAddFG = useMemo(() => {
    let popupContainerForMenu = (node) => document.getElementById('body2');
    const onClickVoid = (event) => {
      if (event && event.domEvent) {
        event.domEvent.stopPropagation();
      }
    };

    return (
      <Menu onClick={onClickVoid} getPopupContainer={popupContainerForMenu}>
        <Menu.Item key={'sql'} onClick={onClickAddFeatureGroup.bind(null, FGLangType.SQL)}>
          SQL Feature Group
        </Menu.Item>
        <Menu.Item key={'python'} onClick={onClickAddFeatureGroup.bind(null, FGLangType.Python)}>
          Python Feature Group
        </Menu.Item>
      </Menu>
    );
  }, []);

  const onChangeStarred = (e) => {
    let v1 = e.target.checked;
    if (v1 !== true) {
      v1 = null;
    }

    setOnlyStarred(v1);
    setTimeout(() => {
      refreshList();
    }, 0);

    Location.push('/' + paramsProp?.get('mode'), undefined, Utils.processParamsAsQuery({ starred: v1 ? '1' : null }, window.location.search));
  };

  return (
    <div className={sd.absolute + ' ' + sd.table} style={{ margin: '25px', position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
      <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH + topHHExtra }}>
        <div
          css={`
            display: flex;
            align-items: center;
          `}
        >
          <span>Feature Groups&nbsp;</span>
          <span>
            <HelpIcon id={'featuregroupslist'} style={{ verticalAlign: 'text-bottom' }} />
          </span>
          <span
            css={`
              flex: 1;
            `}
          ></span>
          <span>
            <DropdownExt overlay={menuAddFG} trigger={['click']} placement={'bottomRight'}>
              <Button style={{ height: '30px', padding: '0 16px' }} type={'primary'}>
                Create Feature Group
              </Button>
            </DropdownExt>
          </span>
        </div>
        <div
          css={`
            display: flex;
            align-items: center;
            margin-top: 8px;
          `}
        >
          <span style={{ width: '280px', display: 'inline-block', verticalAlign: 'top' }}>
            <Input style={{ verticalAlign: 'top', marginTop: '4px' }} placeholder={'Search feature group name, table name or tags'} value={filterText ?? ''} onChange={onChangeFilterText} onKeyDown={onKeyDownFilterText} />
          </span>
          <Button className={sd.detailbuttonblueBorder} ghost style={{ verticalAlign: 'top', marginTop: '1px', height: '30px', marginLeft: '5px' }} type={'primary'} onClick={onClickFilterText}>
            Go
          </Button>
          <Button className={sd.detailbuttonblueBorder} ghost style={{ verticalAlign: 'top', marginTop: '1px', height: '30px', marginLeft: '5px' }} type={'primary'} onClick={onClickFilterTextClear}>
            Clear
          </Button>

          <span
            css={`
              margin-left: 20px;
              font-size: 14px;
            `}
          >
            {null /*'Project '*/}Use Type
          </span>
          <span
            css={`
              margin-left: 5px;
              width: 160px;
              font-size: 13px;
              @media screen and (max-width: 1300px) {
                width: 90px;
              }
            `}
          >
            <SelectExt options={optionsFGTypes} value={optionsFGTypes?.find((o1) => o1.value == filterType)} onChange={onChangeFilterType} />
          </span>

          <span
            css={`
              font-size: 14px;
            `}
          >
            <Checkbox style={{ marginLeft: '25px' }} checked={onlyStarred} onChange={onChangeStarred}>
              <span
                css={`
                  color: white;
                `}
              >
                Show Only Starred
              </span>
            </Checkbox>
          </span>
        </div>
      </div>

      {
        <AutoSizer disableWidth>
          {({ height }) => (
            <RefreshAndProgress isRefreshing={isRefreshing} style={{ top: topAfterHeaderHH + topHHExtra + 'px' }}>
              <TableExt
                showEmptyIcon={true}
                isVirtual
                disableSort
                height={height - topAfterHeaderHH - topHHExtra}
                remoteRowCount={remoteRowCount}
                onNeedMore={onNeedMore}
                dataSource={dataList}
                columns={columns}
                calcKey={calcKeyTable}
                calcLink={calcLinkTable}
              />
            </RefreshAndProgress>
          )}
        </AutoSizer>
      }
    </div>
  );
});

export default FeatureGroupsListAll;
