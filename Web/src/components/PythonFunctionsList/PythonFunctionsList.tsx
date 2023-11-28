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
import { useProject, usePythonFunctionsList, useUseCaseFromProjectOne } from '../../api/REUses';
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
import sd from '../antdUseDark.module.css';

interface IPythonFunctionsListProps {}

const PythonFunctionsList = React.memo((props: PropsWithChildren<IPythonFunctionsListProps>) => {
  const { paramsProp, authUser, algorithmsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    algorithmsParam: state.algorithms,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '' || projectId === '-') {
    projectId = null;
  }

  const projectOne = useProject(projectId);
  const useCaseInfo = useUseCaseFromProjectOne(projectOne, true);
  const problemType = useCaseInfo?.ori?.problemType ?? null;

  const onClickVoid = (event) => {
    if (event && event.domEvent) {
      event.domEvent.stopPropagation();
    }
  };

  const calcLink = useCallback((row) => '/' + PartsLink.python_function_detail + '/' + /*projectId ?? */ '-' + '/' + encodeURIComponent(row?.name), [projectId]);

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
        helpId: 'table_header_name',
        isLinked: true,
      },
      {
        title: 'Type',
        field: 'functionType',
        helpId: 'functionType',
        render: (text, row) => {
          return (
            {
              FEATURE_GROUP: 'Feature Group',
              PLOTLY_FIG: 'Plot',
            }[text] || '-'
          );
        },
        width: 160,
      },
      {
        title: 'Actions',
        render: (text, row) => {
          let popupContainerForMenu = (node) => document.getElementById('body2');

          const menu = (
            <Menu onClick={onClickVoid} getPopupContainer={popupContainerForMenu}>
              <Menu.Item key={'createFG'} onClick={onClickGoLink.bind(null, ['/' + PartsLink.feature_groups_add + '/' + (projectId ?? '-'), 'useType=python&pythonFunctionName=' + row.name])}>
                Create Feature Group From Function
              </Menu.Item>
              <Menu.Item key={'editNB'} onClick={onClickGoLink.bind(null, ['/' + PartsLink.python_functions_one + '/' + (projectId ?? '-') + '/' + encodeURIComponent(row.name), 'notebookId=' + encodeURIComponent(row.notebookId)])}>
                Edit Notebook
              </Menu.Item>
              {
                <Menu.Item key={'del'}>
                  <ModalConfirm
                    onConfirm={onClickDelete.bind(null, row.name)}
                    title={`Do you want to delete this Python Function '${row.name}'?`}
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
  }, [projectId]);

  const onClickDelete = (name) => {
    REClient_.client_().deletePythonFunction(name, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        REActions.addNotification('Done!');

        StoreActions.listPythonFunctions_();
        StoreActions.describePythonFunction_(name);
      }
    });
  };

  let list = usePythonFunctionsList();

  const calcKey = useCallback((r1) => r1.name, []);

  const onClickCreate = (e) => {
    Location.push('/' + PartsLink.python_functions_one, undefined, 'isAdd=1');
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
            Python Functions{projectId == null ? '' : ' for Project'}
            <HelpIcon id={`python_func_${projectId == null ? '' : 'project_'}list_title`} style={{ marginLeft: '4px' }} />
          </span>
          <span
            css={`
              flex: 1;
            `}
          ></span>
          <span>
            <Button type={'primary'} onClick={onClickCreate}>
              Create Python Function
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

export default PythonFunctionsList;
