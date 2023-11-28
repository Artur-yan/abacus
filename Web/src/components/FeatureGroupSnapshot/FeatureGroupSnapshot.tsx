import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Spin from 'antd/lib/spin';
import * as React from 'react';
import { PropsWithChildren, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useDataset, useFeatureGroup } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import featureGroups from '../../stores/reducers/featureGroups';
import FormExt from '../FormExt/FormExt';
import PartsLink from '../NavLeft/PartsLink';
const s = require('./FeatureGroupSnapshot.module.css');
const sd = require('../antdUseDark.module.css');

interface IFeatureGroupSnapshotProps {
  isDataset?: boolean;
}

const FeatureGroupSnapshot = React.memo((props: PropsWithChildren<IFeatureGroupSnapshotProps>) => {
  const { paramsProp, featureGroupsParam, projectsParam, useCasesParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    featureGroupsParam: state.featureGroups,
    useCasesParam: state.useCases,
    projectsParam: state.projects,
  }));

  const [form] = Form.useForm();
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isProcessing, setIsProcessing] = useState(false);

  const isEdit = false;

  const featureGroupVersion = paramsProp?.get('useVersion');
  const datasetVersion = paramsProp?.get('useDatasetVersion');

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }
  const featureGroupId = paramsProp?.get('featureGroupId');
  const datasetId = paramsProp?.get('datasetId');

  const featureGroupOne = useFeatureGroup(null, featureGroupId);
  const datasetOne = useDataset(datasetId);

  React.useEffect(() => {
    featureGroups.memFeatureGroupsVersionsForFeatureGroupId(true, featureGroupId);
  }, [featureGroupsParam, featureGroupId]);

  const featureGroupVersionsList = React.useMemo(() => {
    return featureGroups.memFeatureGroupsVersionsForFeatureGroupId(false, featureGroupId);
  }, [featureGroupsParam, featureGroupId]);

  const warningMsg = React.useMemo(() => {
    const featureGroupVersionOne = featureGroupVersionsList?.find((fgVersion) => fgVersion.featureGroupVersion === featureGroupVersion);

    let nestedFeatures = [];
    featureGroupVersionOne?.features?.forEach((feature) => {
      if (feature.columns) {
        nestedFeatures.push(feature.name);
      }
    });

    let pitGroups = [];
    featureGroupVersionOne?.pointInTimeGroups?.forEach((group) => {
      pitGroups.push(group.groupName);
    });

    let warningMsg = null;
    if (nestedFeatures.length > 0 && pitGroups.length > 0) {
      warningMsg = `This Feature Group has Nested features (${nestedFeatures.join(', ')}) and Point-In-Time features (${pitGroups.join(', ')}) which will not be included in the Snapshot.`;
    } else if (nestedFeatures.length > 0) {
      warningMsg = `This Feature Group has Nested features (${nestedFeatures.join(', ')}) which will not be included in the Snapshot.`;
    } else if (pitGroups.length > 0) {
      warningMsg = `This Feature Group has Point-In-Time features (${pitGroups.join(', ')}) which will not be included in the Snapshot.`;
    }

    return warningMsg;
  }, [featureGroupVersionsList, featureGroupVersion]);

  const attachFgToProject = async (err, res) => {
    if (err || !res?.success) {
      REActions.addNotificationError(err || Constants.errorDefault);
    } else {
      let featureGroupIdRes = res?.result?.featureGroupId;
      if (featureGroupIdRes != null) {
        if (projectId) {
          REClient_.client_().attachFeatureGroupToProject(featureGroupIdRes, projectId, Constants.custom_table, (attachErr, attachRes) => {
            if (attachErr || !attachRes?.success) {
              REActions.addNotificationError(attachErr || Constants.errorDefault);
            } else {
              StoreActions.getProjectDatasets_(projectId, (res, ids) => {
                StoreActions.listDatasets_(ids);
              });
              StoreActions.featureGroupsGetByProject_(projectId, (list) => {
                list?.some((f1) => {
                  StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
                });
              });

              Location.push('/' + PartsLink.feature_group_detail + '/' + projectId + '/' + featureGroupIdRes);
            }
          });
        } else {
          StoreActions.featureGroupsDescribe_(null, featureGroupIdRes);
          Location.push('/' + PartsLink.feature_group_detail + '/-/' + featureGroupIdRes);
        }
      }
    }
  };

  const handleSubmit = (values) => {
    if (props.isDataset) {
      REClient_.client_()._createSnapshotFeatureGroupFromDatasetVersion(datasetVersion, values.tableName, attachFgToProject);
    } else {
      REClient_.client_().createSnapshotFeatureGroup(featureGroupVersion, values.tableName, attachFgToProject);
    }
  };

  let popupContainerForMenu = (node) => document.getElementById('body2');

  return (
    <div style={{ margin: '30px auto', maxWidth: '600px', color: Utils.colorA(1) }}>
      <Card style={{ boxShadow: '0 0 4px rgba(0,0,0,0.2)', border: '1px solid ' + Utils.colorA(0.5), backgroundColor: Utils.colorA(0.04), borderRadius: '5px' }} className={sd.grayPanel}>
        {/*// @ts-ignore*/}
        <Spin spinning={isProcessing} size={'large'}>
          <FormExt layout={'vertical'} form={form} onFinish={handleSubmit} initialValues={{ lastNvalue: 1, timeWindowSizeMsTW: 60 * 60 * 1000 }}>
            <div
              css={`
                margin: 5px 0 20px;
                font-size: 20px;
                color: white;
              `}
            >
              <div
                css={`
                  margin-bottom: 24px;
                  text-align: center;
                `}
              >
                {isEdit ? 'Edit' : 'Create'} Snapshot Feature Group
              </div>

              <Form.Item label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Input {props.isDataset ? 'Dataset' : 'Feature Group'} Name:</span>}>
                <Input
                  css={`
                    &.ant-input.ant-input {
                      background-color: #424242 !important;
                    }
                  `}
                  autoComplete={'off'}
                  value={props.isDataset ? datasetOne?.getIn(['dataset', 'name']) : featureGroupOne?.tableName}
                  disabled={true}
                />
              </Form.Item>

              <Form.Item label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Input {props.isDataset ? 'Dataset' : 'Feature Group'} Version:</span>}>
                <Input
                  css={`
                    &.ant-input.ant-input {
                      background-color: #424242 !important;
                    }
                  `}
                  autoComplete={'off'}
                  value={(props.isDataset ? datasetVersion : featureGroupVersion) ?? '-'}
                  disabled={true}
                />
              </Form.Item>

              <Form.Item name={'tableName'} rules={isEdit ? undefined : [{ required: true, message: 'Required!' }]} label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Snapshot Feature Group Table Name:</span>}>
                <Input
                  css={
                    isEdit
                      ? `&.ant-input.ant-input {
                  background-color: #424242 !important;
                }`
                      : ``
                  }
                  autoComplete={'off'}
                  disabled={isEdit}
                />
              </Form.Item>
            </div>

            <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>
            <div style={{ textAlign: 'center' }}>
              {warningMsg && <div css={'color: #F1C233; margin: 10px;'}>{warningMsg}</div>}
              <Button type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: '16px' }}>
                {isEdit ? 'Save' : `Create Snapshot Feature Group`}
              </Button>
            </div>
          </FormExt>
        </Spin>
      </Card>
    </div>
  );
});

export default FeatureGroupSnapshot;
