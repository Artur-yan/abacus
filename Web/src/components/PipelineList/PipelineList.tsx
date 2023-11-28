import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import Button from 'antd/lib/button';
import Menu from 'antd/lib/menu';
import classNames from 'classnames';
import cronstrue from 'cronstrue';
import * as React from 'react';
import { useCallback, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { usePipelines } from '../../api/REUses';
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
import PipelineCreate from '../PipelineCreate/PipelineCreate';
const styles = require('./PipelineList.module.css');
const stylesDark = require('../antdUseDark.module.css');

const PipelineList = React.memo(() => {
  const { paramsProp } = useSelector((state: any) => ({ paramsProp: state.paramsProp }));
  const [refreshPipelinesState, forceRefreshPipelines] = useReducer((x) => x + 1, 0);
  const [isCreatePipelineModalOpen, setIsCreatePipelineModalOpen] = useState(false);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '' || projectId === '-') {
    projectId = null;
  }

  const onClickVoid = (e: any) => e?.domEvent?.stopPropagation?.();

  const calcLink = useCallback((pipeline: any) => `/${PartsLink.pipeline_details}/${projectId ?? '-'}/${encodeURIComponent(pipeline?.pipelineId)}`, [projectId]);

  const onClickCreate = () => setIsCreatePipelineModalOpen(true);

  const invalidateCachePipelineList = () => {
    if (projectId) StoreActions.listPipelines(projectId);
    StoreActions.listPipelines();
  };

  const onClickDelete = async (pipelineId: string) => {
    try {
      const response = await REClient_.promises_().deletePipeline(pipelineId);
      if (response?.error || !response?.success) throw new Error(response?.error);
      REActions.addNotification('Done!');
      invalidateCachePipelineList();
    } catch (error) {
      REActions.addNotificationError(error.message || Constants.errorDefault);
    }
  };

  const columns = useMemo(() => {
    return [
      {
        title: 'Pipeline ID',
        field: 'pipelineId',
        width: 240,
      },
      {
        title: 'Created At',
        field: 'createdAt',
        render: (text: string) => (text == null ? '-' : <DateOld always date={text} />),
        width: 240,
      },
      {
        title: 'Name',
        field: 'pipelineName',
        isLinked: true,
      },
      {
        title: 'Refresh Schedule',
        render: (text: string, row) => (row.cron == null || row.nextRunTime == null ? '' : cronstrue.toString(row.cron)),
      },
      {
        title: 'Actions',
        render: (text, row) => {
          const menu = (
            <Menu onClick={onClickVoid} getPopupContainer={() => document.getElementById('body2')}>
              <Menu.Item key="delete_pipeline">
                <ModalConfirm
                  onConfirm={() => onClickDelete(row.pipelineId)}
                  title={`Do you want to delete this Pipeline '${row.pipelineName}'?`}
                  icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                  okText="Delete"
                  cancelText="Cancel"
                  okType="danger"
                >
                  <div className={styles.deletePipelineButton}>Delete Pipeline</div>
                </ModalConfirm>
              </Menu.Item>
            </Menu>
          );

          const onClickCancelEvents = (e: any) => e.stopPropagation();

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
        width: 250,
      },
    ].filter((v1) => !(v1 as any).hidden) as ITableExtColumn[];
  }, [projectId]);

  let pipelines = usePipelines(projectId, refreshPipelinesState);
  const calcKey = useCallback((row: any) => row.name, []);

  return (
    <div className={classNames(stylesDark.absolute, stylesDark.table, styles.container)}>
      <div className={classNames(stylesDark.titleTopHeaderAfter, styles.flexContainer)} style={{ height: topAfterHeaderHH }}>
        <span>
          Pipelines
          <HelpIcon id="pipelines_Pipeline" style={{ marginLeft: 4, verticalAlign: 'text-bottom' }} />
        </span>
        <Button type={'primary'} onClick={onClickCreate}>
          Create Pipeline
        </Button>
      </div>

      <AutoSizer disableWidth>
        {({ height }) => (
          <RefreshAndProgress isRefreshing={false} style={{ top: topAfterHeaderHH }}>
            <TableExt isVirtual defaultSort={{ field: 'createdAt', isAsc: false }} showEmptyIcon height={height - topAfterHeaderHH} dataSource={pipelines} columns={columns} calcKey={calcKey} calcLink={calcLink} />
          </RefreshAndProgress>
        )}
      </AutoSizer>
      <PipelineCreate isModalOpen={isCreatePipelineModalOpen} setIsModalOpen={setIsCreatePipelineModalOpen} />
    </div>
  );
});

export default PipelineList;
