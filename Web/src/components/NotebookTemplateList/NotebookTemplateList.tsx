import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import Button from 'antd/lib/button';
import Menu from 'antd/lib/menu';
import classNames from 'classnames';
import * as React from 'react';
import { PropsWithChildren, useCallback, useMemo, useState } from 'react';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useNotebookTemplates } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import DateOld from '../DateOld/DateOld';
import DropdownExt from '../DropdownExt/DropdownExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import PartsLink from '../NavLeft/PartsLink';
import OpenTemplateInNotebook from '../OpenTemplateInNotebook/OpenTemplateInNotebook';
import InternalTag from '../InternalTag/InternalTag';
import styles from './NotebookTemplateList.module.css';
import globalStyles from '../antdUseDark.module.css';

interface NotebookTemplateListProps {}

const NotebookTemplateList = React.memo((props: PropsWithChildren<NotebookTemplateListProps>) => {
  const [openTemplateId, setOpenTemplateId] = useState('');

  const onClickVoid = (event) => {
    if (event && event.domEvent) {
      event.domEvent.stopPropagation();
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
        isLinked: false,
      },
      {
        title: 'Name',
        field: 'name',
        helpId: 'table_header_name',
        isLinked: true,
      },
      {
        title: 'Description',
        field: 'description',
        // helpId: 'table_header_name',
        isLinked: false,
      },
      {
        title: 'Type',
        field: 'templateType',
        helpId: 'templateType',
        width: 200,
        isLinked: false,
      },
      {
        title: 'Actions',
        isLinked: false,
        render: (text, row) => {
          const menu = (
            <Menu onClick={onClickVoid} getPopupContainer={() => document.getElementById('body2')}>
              <Menu.Item key="open_template" onClick={() => setOpenTemplateId(row.notebookTemplateId)}>
                Open in Notebook
              </Menu.Item>
              <Menu.Item key="delete_template">
                <ModalConfirm
                  onConfirm={() => onClickDelete(row.notebookTemplateId)}
                  title={`Do you want to delete this Notebook Template '${row.name}'?`}
                  icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                  okText="Delete"
                  cancelText="Cancel"
                  okType="danger"
                >
                  <div style={{ margin: '-6px -12px', padding: '6px 12px', color: 'red' }}>Delete</div>
                </ModalConfirm>
              </Menu.Item>
            </Menu>
          );

          const onClickCancelEvents = (e) => e.stopPropagation();

          return (
            <span>
              <DropdownExt overlay={menu} trigger={['click']}>
                <Button ghost type="default" onClick={onClickCancelEvents}>
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

  const onClickDelete = async (notebookTemplateId) => {
    try {
      const response = await REClient_.promises_()._deleteNotebookTemplate(notebookTemplateId);
      if (response?.error || !response?.success) throw new Error(response?.error);
      REActions.addNotification('Done!');
      StoreActions._listNotebookTemplates();
    } catch (error) {
      REActions.addNotificationError(error?.message || Constants.errorDefault);
    }
  };

  const onModalOkCancel = () => setOpenTemplateId('');

  let list = useNotebookTemplates();
  const calcKey = useCallback((row: any) => row.name, []);

  const calcLink = (row) => `/${PartsLink.notebook_template_details}/-/${row.notebookTemplateId}`;

  return (
    <div className={classNames(globalStyles.absolute, globalStyles.table, styles.container)}>
      <div className={globalStyles.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
        <div className={styles.titleContainer}>
          Notebook Templates
          <HelpIcon id="notebook_template_list" style={{ marginLeft: 4 }} />
          <InternalTag />
        </div>
      </div>
      <AutoSizer disableWidth>
        {({ height }) => {
          let hh = height - topAfterHeaderHH;
          return (
            <div style={hh == null ? {} : { top: topAfterHeaderHH }}>
              <TableExt isVirtual defaultSort={{ field: 'createdAt', isAsc: false }} showEmptyIcon height={hh} dataSource={list} columns={columns} calcKey={calcKey} calcLink={calcLink} />
            </div>
          );
        }}
      </AutoSizer>
      <OpenTemplateInNotebook onCancel={onModalOkCancel} onOk={onModalOkCancel} notebookTemplateId={openTemplateId} isOpen={!!openTemplateId} />
    </div>
  );
});

export default NotebookTemplateList;
