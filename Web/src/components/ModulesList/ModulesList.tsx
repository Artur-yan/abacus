import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import Button from 'antd/lib/button';
import Menu from 'antd/lib/menu';
import * as _ from 'lodash';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useCallback, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Location from '../../../core/Location';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useModulesList } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import DateOld from '../DateOld/DateOld';
import DropdownExt from '../DropdownExt/DropdownExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const sd = require('../antdUseDark.module.css');

interface IModuleListProps {}

const ModuleList = React.memo((props: PropsWithChildren<IModuleListProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onClickVoid = (event) => {
    if (event && event.domEvent) {
      event.domEvent.stopPropagation();
    }
  };

  const calcLink = useCallback((row) => ['/' + PartsLink.module_one + '/' + '-' + '/' + encodeURIComponent(row?.name), 'isEdit=1'], []);

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

  const columns = useMemo(() => {
    return [
      {
        title: 'Created At',
        field: 'createdAt',
        render: (text) => {
          return text == null ? '-' : <DateOld always date={text} />;
        },
        width: 240,
      },
      {
        title: 'Name',
        field: 'name',
        isLinked: true,
      },
      {
        title: 'Actions',
        render: (text, row) => {
          let popupContainerForMenu = (node) => document.getElementById('body2');

          const menu = (
            <Menu onClick={onClickVoid} getPopupContainer={popupContainerForMenu}>
              {row.notebookId && (
                <Menu.Item key={'editNB'} onClick={onClickGoLink.bind(null, ['/' + PartsLink.module_one + '/' + '-' + '/' + encodeURIComponent(row.name), 'notebookId=' + encodeURIComponent(row.notebookId)])}>
                  Edit Notebook
                </Menu.Item>
              )}
              {
                <Menu.Item key={'del'}>
                  <ModalConfirm
                    onConfirm={onClickDelete.bind(null, row.name)}
                    title={`Do you want to delete this module '${row.name}'?`}
                    icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                    okText={'Delete'}
                    cancelText={'Cancel'}
                    okType={'danger'}
                  >
                    <div style={{ margin: '-6px -12px', padding: '6px 12px', color: 'red' }}>Delete</div>
                  </ModalConfirm>
                </Menu.Item>
              }
            </Menu>
          );

          const onClickCancelEvents = (e) => {
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
        width: 160 + 90,
      },
    ].filter((v1) => !(v1 as any).hidden) as ITableExtColumn[];
  }, []);

  const onClickDelete = (name) => {
    REClient_.client_().deleteModule(name, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        REActions.addNotification('Done!');

        StoreActions.listModules_();
        StoreActions.describeModule_(name);
      }
    });
  };

  let list = useModulesList();

  const calcKey = useCallback((r1) => r1.name, []);

  const onClickCreate = (e) => {
    Location.push('/' + PartsLink.module_one, undefined, 'isAdd=1');
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
            Modules
            <HelpIcon id={`modules_list_title`} style={{ marginLeft: '4px' }} />
          </span>
          <span
            css={`
              flex: 1;
            `}
          ></span>
          <span>
            <Button type={'primary'} onClick={onClickCreate}>
              Create module
            </Button>
          </span>
        </div>
      </div>
      <AutoSizer disableWidth>
        {({ height }) => {
          let hh = height - topAfterHeaderHH;

          return (
            <RefreshAndProgress isRefreshing={isRefreshing} style={hh == null ? {} : { top: topAfterHeaderHH + 'px' }}>
              <TableExt isVirtual defaultSort={{ field: 'createdAt', isAsc: false }} showEmptyIcon={true} height={hh} dataSource={list} columns={columns} calcKey={calcKey} calcLink={calcLink} />
            </RefreshAndProgress>
          );
        }}
      </AutoSizer>
      ;
    </div>
  );
});

export default ModuleList;
