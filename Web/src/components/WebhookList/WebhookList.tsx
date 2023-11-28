import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import Button from 'antd/lib/button';
import * as React from 'react';
import { PropsWithChildren, useCallback, useMemo, useReducer, useRef } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useWebhookList } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import CopyText from '../CopyText/CopyText';
import HelpIcon from '../HelpIcon/HelpIcon';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import PartsLink from '../NavLeft/PartsLink';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TextMax from '../TextMax/TextMax';
import { calcWebhookIdToString, IWebhookId } from './WebhookIdHelpers';

const s = require('./WebhookList.module.css');
const sd = require('../antdUseDark.module.css');

interface IWebhookListProps {
  id?: IWebhookId;
}

const WebhookList = React.memo((props: PropsWithChildren<IWebhookListProps>) => {
  const { paramsProp, authUser, deploymentsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    deploymentsParam: state.deployments,
  }));

  const tableRef = useRef(null);
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '' || projectId === '-') {
    projectId = null;
  }

  const dataList = useWebhookList(props.id);
  // console.warn(dataList, props.id);

  const title1 = useMemo(() => {
    return 'WebHooks';
  }, [props.id]);

  const helpId1 = useMemo(() => {
    return 'webhooks_' + (calcWebhookIdToString(props.id, true) ?? '');
  }, [props.id]);

  const calcKey1 = useCallback((d1) => d1?.webhookId, []);
  const calcLink1 = useCallback((row) => '/' + PartsLink.webhook_one + '/' + (projectId ?? '-') + '/' + row?.webhookId, [projectId, props.id]);

  const onClickDelete = (webhookId, e) => {
    REClient_.client_().deleteWebhook(webhookId, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        REActions.addNotification('Done!');

        StoreActions.listWebhooks_(props.id);
        StoreActions.describeWebhook_(webhookId);
      }
    });
  };

  const columns = useMemo(() => {
    return [
      {
        title: 'Webhook Id',
        field: 'webhookId',
        render: (text) => {
          return <CopyText>{text}</CopyText>;
        },
        isLinked: true,
        width: 130,
      },
      {
        title: 'Event',
        field: 'webhookEventType',
        width: 200,
        render: (text) => {
          return Utils.camelCaseWords(text);
        },
      },
      {
        title: 'Endpoint',
        field: 'endpoint',
        render: (text) => {
          return (
            <span>
              <TextMax max={50}>{text}</TextMax>
              <CopyText noText>{text}</CopyText>
            </span>
          );
        },
      },
      {
        title: 'Payload Format',
        field: 'payloadTemplate',
        render: (text) => {
          return (
            <span>
              <TextMax max={30}>{text}</TextMax>
              <CopyText noText>{text}</CopyText>
            </span>
          );
        },
      },
      {
        title: 'Actions',
        render: (text, row) => {
          return (
            <span>
              <ModalConfirm
                onConfirm={onClickDelete.bind(null, row.webhookId)}
                title={`Do you want to delete this webhook?`}
                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                okText={'Delete'}
                cancelText={'Cancel'}
                okType={'danger'}
              >
                <Button type={'default'} danger ghost>
                  Delete
                </Button>
              </ModalConfirm>
            </span>
          );
        },
      },
    ] as ITableExtColumn[];
  }, []);

  const onClickAdd = (e) => {
    Location.push('/' + PartsLink.webhook_add + '/' + projectId, undefined, 'deploymentId=' + encodeURIComponent(props.id?.deploymentId || ''));
  };

  return (
    <div>
      <div
        className={sd.titleTopHeaderAfter}
        style={{ marginBottom: '14px' }}
        css={`
          display: flex;
          align-items: center;
        `}
      >
        <span>{title1}</span>
        <HelpIcon id={helpId1} style={{ marginLeft: '4px' }} />
        <span
          css={`
            flex: 1;
          `}
        ></span>
        <span>
          {projectId != null && (
            <Button style={{ marginRight: 16 }} ghost type={'default'} onClick={onClickAdd}>
              Add New Webhook
            </Button>
          )}
        </span>
      </div>

      <TableExt ref={tableRef} isDetailTheme showEmptyIcon dataSource={dataList} columns={columns} calcKey={calcKey1} calcLink={calcLink1} />
    </div>
  );
});

export default WebhookList;
