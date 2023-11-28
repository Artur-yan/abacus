import AlertTwoTone from '@ant-design/icons/AlertTwoTone';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import * as React from 'react';
import { PropsWithChildren, useMemo, useReducer, useRef } from 'react';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import FormExt from '../FormExt/FormExt';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import PartsLink from '../NavLeft/PartsLink';
const s = require('./FGStreamingWork.module.css');
const sd = require('../antdUseDark.module.css');

interface IFGStreamingWorkProps {
  projectId?: string;
  featureGroupId?: string;
  noPushLocation?: boolean;
}

const FGStreamingWork = React.memo((props: PropsWithChildren<IFGStreamingWorkProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const refStreamingForm = useRef(null);

  const onClickAddStreaming = (projectId, featureGroupId, e) => {
    if (!featureGroupId) {
      return null;
    }

    return new Promise<boolean>((resolve) => {
      refStreamingForm?.current
        ?.validateFields(['tableName'])
        .then((values) => {
          refStreamingForm?.current?.setFieldsValue({});

          REClient_.client_()._createStreamingFeatureGroupFromBatch(projectId, featureGroupId, values.tableName, (err, res) => {
            if (err || !res?.success) {
              REActions.addNotificationError(err || Constants.errorDefault);
              resolve(false);
            } else {
              resolve(true);

              StoreActions.getProjectsById_(projectId);
              StoreActions.getProjectDatasets_(projectId, (res, ids) => {
                StoreActions.listDatasets_(ids);
              });
              StoreActions.featureGroupsGetByProject_(projectId);
              if (projectId) {
                StoreActions.featureGroupsDescribe_(projectId, props.featureGroupId);
              }
              StoreActions.featureGroupsDescribe_(null, props.featureGroupId);

              if (!props.noPushLocation) {
                setTimeout(() => {
                  Location.push('/' + PartsLink.feature_group_detail + '/' + (projectId ?? '-') + '/' + res?.result?.featureGroupId);
                }, 0);
              }
            }
          });
        })
        .catch((err) => {
          resolve(false);
        });
    });
  };

  const streamingElem = useMemo(() => {
    return (
      <div className={'useDark'}>
        <div
          css={`
            margin-bottom: 10px;
            font-size: 18px;
          `}
        >
          Add Streaming Feature Group
        </div>
        <div>
          <FormExt layout={'vertical'} ref={refStreamingForm}>
            <Form.Item
              name={'tableName'}
              rules={[{ required: true }]}
              style={{ marginTop: '15px', marginBottom: '1px' }}
              label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Streaming Table Name:&nbsp;&nbsp;&nbsp;&nbsp;</span>}
            >
              <Input />
            </Form.Item>
          </FormExt>
        </div>
      </div>
    );
  }, []);

  return (
    <ModalConfirm
      onConfirmPromise={onClickAddStreaming.bind(null, props.projectId, props.featureGroupId)}
      title={streamingElem}
      icon={<AlertTwoTone style={{ color: 'darkgreen' }} />}
      okText={'Add Streaming'}
      cancelText={'Cancel'}
      okType={'primary'}
    >
      {props.children}
    </ModalConfirm>
  );
});

export default FGStreamingWork;
