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
import { useAlgorithmsAll, useListAvailableProblemTypesForAlgorithms, useProject, useUseCaseFromProjectOne } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import DateOld from '../DateOld/DateOld';
import DropdownExt from '../DropdownExt/DropdownExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import RegisterAlgoButton from '../RegisterAlgoButton/RegisterAlgoButton';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
const s = require('./AlgorithmList.module.css');
const sd = require('../antdUseDark.module.css');

interface IAlgorithmListProps {}

const AlgorithmList = React.memo((props: PropsWithChildren<IAlgorithmListProps>) => {
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

  const calcLink = useCallback((row) => ['/' + PartsLink.algorithm_one + '/' + (projectId ?? '-') + '/' + encodeURIComponent(row?.name), 'isEdit=1'], [projectId]);

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
        width: 200,
      },
      {
        title: 'Name',
        field: 'name',
        helpId: 'table_header_name',
        isLinked: true,
      },
      // {
      //   title: 'Display Name',
      //   field: 'displayName',
      //   isLinked: true,
      // },
      {
        title: 'Is Default Enabled',
        field: 'isDefaultEnabled',
        helpId: 'table_header_isDefaultEnabled',
        render: (text, row) => {
          return <span>{text ? 'True' : 'False'}</span>;
        },
        width: 180,
      },
      {
        title: 'Problem Type',
        field: 'problemType',
      },
      {
        title: 'Actions',
        render: (text, row) => {
          let popupContainerForMenu = (node) => document.getElementById('body2');

          const menu = (
            <Menu onClick={onClickVoid} getPopupContainer={popupContainerForMenu}>
              {/*<Menu.Item key={'3ren'}>*/}
              {/*  <ModalConfirm onConfirmPromise={onClickRename.bind(null, row.notebookId)} title={renameElem} icon={<QuestionCircleOutlined style={{ color: 'darkgreen' }} />} okText={'Rename'} cancelText={'Cancel'} okType={'primary'}>*/}
              {/*    <div style={{ margin: '-6px -12px', padding: '6px 12px', }}>Rename...</div>*/}
              {/*  </ModalConfirm>*/}
              {/*</Menu.Item>*/}
              <Menu.Item key={'editNB'} onClick={onClickGoLink.bind(null, ['/' + PartsLink.algorithm_one + '/' + (projectId ?? '-') + '/' + encodeURIComponent(row.name), 'notebookId=' + encodeURIComponent(row.notebookId)])}>
                Edit Notebook
              </Menu.Item>
              {/*<Menu.Item key={'cre'} onClick={onClickGoLink.bind(null, ['/'+PartsLink.feature_groups_template_add+'/'+(projectId ?? '-'), 'isAttach=1&useTemplateId='+encodeURIComponent(row.featureGroupTemplateId)])}>Create Feature Group using Template</Menu.Item>*/}
              {
                <Menu.Item key={'del'}>
                  <ModalConfirm
                    onConfirm={onClickDelete.bind(null, row.name)}
                    title={`Do you want to delete this algorithm '${row.name}'?`}
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
            // e.preventDefault();
            e.stopPropagation();
          };

          // return <span>
          //   {/*<Button type={'primary'} onClick={onClickGoLink.bind(null, ['/'+PartsLink.feature_groups_template_add+'/'+(projectId ?? '-'), 'isAttach=1&useTemplateId='+encodeURIComponent(row.featureGroupTemplateId)])}>Create FG from template</Button>*/}
          // </span>;

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

  const onClickDelete = (algoName) => {
    REClient_.client_().deleteAlgorithm(algoName, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        REActions.addNotification('Done!');

        StoreActions.listAlgosByProblemTypeId_(problemType);
        StoreActions.listAlgosByProblemTypeId_(problemType, projectId);
      }
    });
  };

  let list = useAlgorithmsAll(projectId == null ? null : problemType, projectId);
  if (projectId != null && problemType == null) {
    list = null;
  }

  const calcKey = useCallback((r1) => r1.name, []);

  const listAlgoForProblemTypes = useListAvailableProblemTypesForAlgorithms();

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
            Algorithms{projectId == null ? '' : ' for Project'}
            <HelpIcon id={`algo_${projectId == null ? '' : 'project_'}list_title`} style={{ marginLeft: '4px' }} />
          </span>
          <span
            css={`
              flex: 1;
            `}
          ></span>
          <span>
            <RegisterAlgoButton projectId={projectId} suffix={projectId == null ? '' : ` for Project`} />
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

export default AlgorithmList;
