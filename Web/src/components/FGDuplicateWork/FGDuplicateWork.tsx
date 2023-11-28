import AlertTwoTone from '@ant-design/icons/AlertTwoTone';
import Checkbox from 'antd/lib/checkbox';
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
const s = require('./FGDuplicateWork.module.css');
const sd = require('../antdUseDark.module.css');

interface IFGDuplicateWorkProps {
  projectId?: string;
  featureGroupId?: string;
  noPushLocation?: boolean;
}

const FGDuplicateWork = React.memo((props: PropsWithChildren<IFGDuplicateWorkProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const refDuplicateForm = useRef(null);

  const onClickDuplicateFG = (projectId, featureGroupId, e) => {
    if (!featureGroupId) {
      return null;
    }

    return new Promise<boolean>((resolve) => {
      refDuplicateForm?.current
        ?.validateFields(['tableName', 'copySchema', 'copyNested'])
        .then((values) => {
          refDuplicateForm?.current?.setFieldsValue({});

          REClient_.client_()._copyFeatureGroup(featureGroupId, values.tableName, values.copySchema, values.copyNested, projectId, (err, res) => {
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

  const duplicateElem = useMemo(() => {
    return (
      <div className={'useDark'}>
        <div
          css={`
            margin-bottom: 10px;
            font-size: 18px;
          `}
        >
          Duplicate Feature group
        </div>
        <div>
          <FormExt layout={'vertical'} ref={refDuplicateForm} initialValues={{ copySchema: true, copyNested: true }}>
            {/*<SelectExt value={optionfeatureGroupsel} options={optionsfeatureGroups} onChange={this.onChangeSelectDataset} isSearchable={true} menuPortalTarget={menuPortalTarget} />*/}

            <Form.Item name={'tableName'} rules={[{ required: true }]} style={{ marginTop: '15px', marginBottom: '1px' }} label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Table Name:&nbsp;&nbsp;&nbsp;&nbsp;</span>}>
              <Input />
            </Form.Item>

            <Form.Item name={'copySchema'} valuePropName={'checked'} style={{ marginTop: '15px', marginBottom: '1px' }} label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Copy Schema:&nbsp;&nbsp;&nbsp;&nbsp;</span>}>
              <Checkbox />
            </Form.Item>

            <Form.Item name={'copyNested'} valuePropName={'checked'} style={{ marginTop: '15px', marginBottom: '1px' }} label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Copy Nested:&nbsp;&nbsp;&nbsp;&nbsp;</span>}>
              <Checkbox />
            </Form.Item>
          </FormExt>
        </div>
      </div>
    );
  }, []);

  return (
    <ModalConfirm
      onConfirmPromise={onClickDuplicateFG.bind(null, props.projectId, props.featureGroupId)}
      title={duplicateElem}
      icon={<AlertTwoTone style={{ color: 'darkgreen' }} />}
      okText={'Duplicate'}
      cancelText={'Cancel'}
      okType={'primary'}
    >
      {props.children}
    </ModalConfirm>
  );
});

export default FGDuplicateWork;
