import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Input from 'antd/lib/input';
import * as _ from 'lodash';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useFeatureGroupFromProject } from '../../api/REUses';
import Constants from '../../constants/Constants';
import DateOld from '../DateOld/DateOld';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import LinkFG from '../LinkFG/LinkFG';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./TemplateList.module.css');
const sd = require('../antdUseDark.module.css');

interface ITemplateListProps {}

const TemplateList = React.memo((props: PropsWithChildren<ITemplateListProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [ignoredRefresh, forceUpdateRefresh] = useReducer((x) => x + 1, 0);
  const [list, setList] = useState(null as any[]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [filterOnlySystem, setFilterOnlySystem] = useState(false);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '' || projectId === '-') {
    projectId = null;
  }

  useEffect(() => {
    let a1 = ignoredRefresh;
    if (a1 > 0) {
      setIsRefreshing(true);
    }

    const cb1 = (err, res) => {
      if (a1 > 0) {
        setIsRefreshing(false);
      }
      setList(res?.result);
    };

    if (projectId) {
      REClient_.client_().listProjectFeatureGroupTemplates(9000, null, projectId, true, cb1);
    } else {
      REClient_.client_().listFeatureGroupTemplates(9000, null, null, true, cb1);
    }
  }, [ignoredRefresh, projectId]);

  const fgList = useFeatureGroupFromProject(projectId);
  const fgListByTemplateId = useMemo(() => {
    if (fgList == null) {
      return fgList;
    }

    let allFG: any = {};
    fgList?.some((fg1) => {
      if (!Utils.isNullOrEmpty(fg1.featureGroupTemplate?.featureGroupTemplateId)) {
        allFG[fg1.featureGroupTemplate?.featureGroupTemplateId] ??= [];
        allFG[fg1.featureGroupTemplate?.featureGroupTemplateId].push(fg1);
      }
    });
    return allFG;
  }, [fgList]);
  const fgIdsByTemplateId = useMemo(() => {
    if (fgList == null) {
      return fgList;
    }

    let allFG: any = {};
    list?.some((t1) => {
      let fgId = t1.featureGroupId;
      allFG[t1.featureGroupTemplateId] ??= [];
      allFG[t1.featureGroupTemplateId].push(fgId);
    });
    return allFG;
  }, [fgList, list]);

  const onClickDelete = (featureGroupTemplateId) => {
    REClient_.client_().deleteFeatureGroupTemplate(featureGroupTemplateId, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        REActions.addNotification('Done!');
        forceUpdateRefresh();
      }
    });
  };

  const onClickGoLink = (link1, e) => {
    if (e && e.domEvent) {
      e.domEvent.stopPropagation();
      e.domEvent.preventDefault();
    }

    e.preventDefault?.();
    e.stopPropagation?.();

    if (_.isArray(link1)) {
      Location.push(link1?.[0], undefined, link1?.[1]);
    } else {
      Location.push(link1);
    }
  };

  const onClickVoid = (event) => {
    if (event && event.domEvent) {
      event.domEvent.stopPropagation();
    }
  };

  const columns = useMemo(() => {
    return (
      [
        {
          title: 'Created At',
          field: 'createdAt',
          render: (text) => {
            return text == null ? '-' : <DateOld always date={text} />;
          },
          width: 200,
          helpId: 'template_list_created_at',
        },
        {
          title: 'Template ID',
          field: 'featureGroupTemplateId',
          isLinked: true,
          width: 200,
          hidden: true,
          helpId: 'template_list_template_id',
        },
        {
          title: 'Name',
          field: 'name',
          helpId: 'template_list_name',
          isLinked: true,
        },
        {
          title: 'Type',
          field: 'isSystemTemplate',
          helpId: 'template_list_is_system_type',
          render: (text, row) => {
            return <span>{text ? 'System' : ''}</span>;
          },
          hidden: !!Constants.flags.hide_system_templates,
          width: 90 + 18,
        },
        {
          title: 'Source Feature Group',
          field: 'featureGroupId',
          helpId: 'template_list_source_fg',
          render: (text, row) => {
            if (row.isSystemTemplate) {
              return null;
            }
            return (
              <LinkFG forceSpanUse projectId={projectId} featureGroupId={row.featureGroupId} showTablenameAsText>
                {row.featureGroupId}
              </LinkFG>
            );
          },
        },
        // {
        //   title: 'Feature Groups',
        //   render: (text, row) => {
        //     if(fgListByTemplateId==null) {
        //       return null;
        //     }
        //
        //     let templateId = row.featureGroupTemplateId;
        //     if(Utils.isNullOrEmpty(templateId)) {
        //       return null;
        //
        //     } else {
        //       let FGids = fgListByTemplateId?.[templateId];
        //       if(FGids==null) {
        //         if(fgIdsByTemplateId?.[templateId]!=null) {
        //           return <span css={`opacity: 0.7;`}>(Template created from FG <LinkFG forceSpanUse showTablenameAsText featureGroupId={fgIdsByTemplateId?.[templateId]?.[0]}>{fgIdsByTemplateId?.[templateId]?.[0]}</LinkFG>)</span>;
        //         } else {
        //           return null;
        //         }
        //
        //       } else {
        //         return <span>
        //           {FGids?.map((fg1, id1ind) => {
        //             return <span key={'f'+id1ind}>
        //               {id1ind>0 ? <span css={`opacity: 0.8;`}>, </span> : null}
        //               <LinkFG projectId={projectId} featureGroup={fg1} forceSpanUse>{fg1.tableName}</LinkFG>
        //             </span>;
        //           })}
        //         </span>;
        //       }
        //     }
        //   },
        //   hidden: projectId==null,
        // },
        {
          title: 'Actions',
          helpId: 'template_list_actions',
          render: (text, row) => {
            let popupContainerForMenu = (node) => document.getElementById('body2');

            // const menu = (
            //   <Menu onClick={onClickVoid} getPopupContainer={popupContainerForMenu}>
            //     {/*<Menu.Item key={'3ren'}>*/}
            //     {/*  <ModalConfirm onConfirmPromise={onClickRename.bind(null, row.notebookId)} title={renameElem} icon={<QuestionCircleOutlined style={{ color: 'darkgreen' }} />} okText={'Rename'} cancelText={'Cancel'} okType={'primary'}>*/}
            //     {/*    <div style={{ margin: '-6px -12px', padding: '6px 12px', }}>Rename...</div>*/}
            //     {/*  </ModalConfirm>*/}
            //     {/*</Menu.Item>*/}
            //     <Menu.Item key={'edit'} onClick={onClickGoLink.bind(null, calcLink(row))}>Edit</Menu.Item>
            //     <Menu.Item key={'cre'} onClick={onClickGoLink.bind(null, ['/'+PartsLink.feature_groups_template_add+'/'+(projectId ?? '-'), 'isAttach=1&useTemplateId='+encodeURIComponent(row.featureGroupTemplateId)])}>Create Feature Group using Template</Menu.Item>
            //     {<Menu.Item key={'6'}>
            //       <ModalConfirm onConfirm={onClickDelete.bind(null, row.featureGroupTemplateId)} title={`Do you want to delete this template '${row.name}'?`} icon={<QuestionCircleOutlined style={{ color: 'red' }} />} okText={'Delete'} cancelText={'Cancel'} okType={'danger'}>
            //         <div style={{ margin: '-6px -12px', padding: '6px 12px', color: 'red', }}>Delete</div>
            //       </ModalConfirm>
            //     </Menu.Item>}
            //   </Menu>
            // );

            const onClickCancelEvents = (e) => {
              // e.preventDefault();
              e.stopPropagation();
            };

            return (
              <span>
                <Button type={'primary'} onClick={onClickGoLink.bind(null, ['/' + PartsLink.feature_groups_template_add + '/' + (projectId ?? '-'), 'isAttach=1&useTemplateId=' + encodeURIComponent(row.featureGroupTemplateId)])}>
                  Create FG from template
                </Button>
              </span>
            );

            // return <span>
            //   <DropdownExt overlay={menu} trigger={['click']}>
            //     <Button ghost type={'default'} onClick={onClickCancelEvents}>Actions</Button>
            //   </DropdownExt>
            // </span>;
          },
          width: 160 + 90,
        },
      ] as ITableExtColumn[]
    ).filter((v1) => !(v1 as any).hidden);
  }, [projectId]);

  const onClickRefreshList = (e) => {
    forceUpdateRefresh();
  };

  // const calcLink = useCallback((row) => (['/'+PartsLink.feature_groups_edit+'/'+(row?.projectId ?? '-')+'/-', 'useType=sql&useTemplateId='+encodeURIComponent(row?.featureGroupTemplateId)+('&fullEdit=1')]), []);
  const calcLink = useCallback((row) => '/' + PartsLink.template_detail + '/' + row?.featureGroupTemplateId, [projectId]);

  const calcKey = useCallback((r1) => r1.featureGroupTemplateId, []);

  const listFiltered = useMemo(() => {
    let res;

    let fs = _.trim(filterText || '').toLowerCase();
    if (fs === '' || fs == null) {
      res = list;
    } else {
      res = list?.filter((o1) => Utils.searchIsTextInside(o1.name?.toLowerCase(), fs));
    }

    if (projectId != null) {
      if (fgListByTemplateId == null) {
        res = null;
      }
      if (res != null) {
        res = res.filter((o1) => fgListByTemplateId?.[o1.featureGroupTemplateId] != null || fgIdsByTemplateId?.[o1.featureGroupTemplateId] != null);
      }
    }

    if (filterOnlySystem === true) {
      if (res != null) {
        res = res.filter((o1) => o1?.isSystemTemplate === true);
      }
    }

    return res;
  }, [list, filterText, projectId, fgListByTemplateId, fgIdsByTemplateId, filterOnlySystem]);

  const onChangeFilterText = (e) => {
    setFilterText(e.target.value || '');
  };

  const onClickFilterTextClear = (e) => {
    setFilterText('');
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
            Templates
            <HelpIcon id={'templatesall_title'} style={{ marginLeft: '4px' }} />
          </span>
          {/*<span css={`margin-left: 20px;`}>*/}
          {/*  <Button type={'primary'} ghost onClick={onClickRefreshList}>Refresh List</Button>*/}
          {/*</span>*/}
          <Input style={{ marginLeft: '20px', width: '240px', verticalAlign: 'top', marginTop: '4px' }} placeholder={'Filter Templates'} value={filterText ?? ''} onChange={onChangeFilterText} />
          <Button className={sd.detailbuttonblueBorder} ghost style={{ marginTop: '1px', height: '30px', marginLeft: '5px' }} type={'primary'} onClick={onClickFilterTextClear}>
            Clear
          </Button>
          {!Constants.flags.hide_system_templates && projectId == null && (
            <Checkbox
              css={`
                margin-left: 15px;
              `}
              checked={filterOnlySystem}
              onChange={(e) => {
                setFilterOnlySystem(e.target.checked);
              }}
            >
              <span
                css={`
                  color: white;
                `}
              >
                Show Only System Templates
              </span>
            </Checkbox>
          )}
          <span
            css={`
              flex: 1;
            `}
          ></span>
          {false && (
            <span>
              <Link to={'/' + PartsLink.feature_groups_template_add}>
                <Button type={'primary'}>Create Template</Button>
              </Link>
            </span>
          )}
        </div>
      </div>
      <AutoSizer disableWidth>
        {({ height }) => {
          let hh = height - topAfterHeaderHH;

          return (
            <RefreshAndProgress isRefreshing={isRefreshing} style={hh == null ? {} : { top: topAfterHeaderHH + 'px' }}>
              <TableExt isVirtual defaultSort={{ field: 'createdAt', isAsc: false }} showEmptyIcon={true} height={hh} dataSource={listFiltered} columns={columns} calcKey={calcKey} calcLink={calcLink} />
            </RefreshAndProgress>
          );
        }}
      </AutoSizer>
      ;
    </div>
  );
});

export default TemplateList;
