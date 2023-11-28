import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Checkbox from 'antd/lib/checkbox';
import Collapse from 'antd/lib/collapse';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import InputNumber from 'antd/lib/input-number';
import Spin from 'antd/lib/spin';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import featureGroups from '../../stores/reducers/featureGroups';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import PartsLink from '../NavLeft/PartsLink';
import SelectExt from '../SelectExt/SelectExt';
import TagsSelectExt from '../TagsSelectExt/TagsSelectExt';
const s = require('./FeatureGroupsTransform.module.css');
const sd = require('../antdUseDark.module.css');
const { Panel } = Collapse;

enum TransformTypeFG {
  PIVOT = 'PIVOT',
  UNPIVOT = 'UNPIVOT',
}

interface IFeatureGroupsTransformProps {}

const FeatureGroupsTransform = React.memo((props: PropsWithChildren<IFeatureGroupsTransformProps>) => {
  const { paramsProp, featureGroupsParam, projectsParam, useCasesParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    featureGroupsParam: state.featureGroups,
    useCasesParam: state.useCases,
    projectsParam: state.projects,
  }));

  const [typeSel, setTypeSel] = useState(TransformTypeFG.UNPIVOT);

  const [form] = Form.useForm();
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isProcessing, setIsProcessing] = useState(false);

  let isEdit = paramsProp?.get('edit') === 'true';

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }
  const featureGroupId = paramsProp?.get('featureGroupId');

  // useEffect(() => {
  //   memProjectById(projectId, true);
  // }, [projectsParam, projectId]);
  // const foundProject1 = useMemo(() => {
  //   return memProjectById(projectId, false);
  // }, [projectsParam, projectId]);

  useEffect(() => {
    featureGroups.memFeatureGroupsForId(true, null, featureGroupId);
  }, [featureGroupsParam, featureGroupId]);
  const featureGroupOne = useMemo(() => {
    return featureGroups.memFeatureGroupsForId(false, null, featureGroupId);
  }, [featureGroupsParam, featureGroupId]);

  const handleSubmit = (values) => {
    let vv: any = {};

    switch (typeSel) {
      case TransformTypeFG.PIVOT:
        vv = { transformType: 'PIVOT', numVersions: values.lastNvalue };
        break;

      case TransformTypeFG.UNPIVOT:
        vv = { transformType: 'UNPIVOT', columns: values.unpivotColumns, indexColumn: values.unpivotIndexColumn, valueColumn: values.unpivotValueColumn, exclude: values.unpivotExclude };
        break;
    }

    //
    if (isEdit) {
      REClient_.client_().setFeatureGroupTransformConfig(featureGroupId, vv, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          if (projectId) {
            StoreActions.getProjectsById_(projectId);
            StoreActions.featureGroupsGetByProject_(projectId);

            StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
          }
          StoreActions.featureGroupsDescribe_(null, featureGroupId);

          let backToUrl = paramsProp?.get('backToUrl');
          if (Utils.isNullOrEmpty(backToUrl)) {
            Location.push('/' + PartsLink.feature_group_detail + '/' + (projectId ?? '-') + '/' + featureGroupId);
          } else {
            Location.push(backToUrl, undefined, paramsProp?.get('backToUrlParams'));
          }
        }
      });
    } else {
      REClient_.client_().createTransformFeatureGroup(featureGroupId, values.tableName, vv, null, null, null, projectId, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          let featureGroupIdRes = res?.result?.featureGroupId;
          if (featureGroupIdRes != null) {
            if (projectId) {
              StoreActions.getProjectsById_(projectId);
              StoreActions.featureGroupsGetByProject_(projectId);

              StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
            }
            StoreActions.featureGroupsDescribe_(null, featureGroupId);

            Location.push('/' + PartsLink.feature_group_detail + '/' + (projectId ?? '-') + '/' + featureGroupIdRes);
          }
        }
      });
    }
  };

  let popupContainerForMenu = (node) => document.getElementById('body2');

  const optionsTransformConfig = useMemo(() => {
    return [
      // {
      //   label: 'Pivot',
      //   value: TransformTypeFG.PIVOT,
      // },
      {
        label: 'Transpose',
        value: TransformTypeFG.UNPIVOT,
      },
    ];
  }, []);

  const onChangeTransformConfigOption = (option1) => {
    setTypeSel(option1?.value);
  };

  const fgIdForFeatures = useMemo(() => {
    if (isEdit) {
      return featureGroupOne?.sourceTableInfos?.[0]?.featureGroupId ?? featureGroupId;
    } else {
      return featureGroupId;
    }
  }, [isEdit, featureGroupId, featureGroupOne]);

  useEffect(() => {
    featureGroups.memFeatureGroupsForId(true, null, fgIdForFeatures);
  }, [featureGroupsParam, fgIdForFeatures]);
  const featureGroupOneForFeatures = useMemo(() => {
    return featureGroups.memFeatureGroupsForId(false, null, fgIdForFeatures);
  }, [featureGroupsParam, fgIdForFeatures]);

  const optionsFeatureNames = useMemo(() => {
    let res = featureGroupOneForFeatures?.features?.map((s1, s1ind) => ({ label: s1.name, value: s1.name, data: s1 }));
    if (res != null) {
      res = _.sortBy(res, ['value']);
    }
    if (res == null && featureGroupOneForFeatures != null) {
      res = [];
    }
    return res;
  }, [featureGroupOneForFeatures]);

  const optionsFeatureNamesTimestamp = useMemo(() => {
    let res = featureGroupOneForFeatures?.features?.filter((f1) => f1?.featureType?.toUpperCase() === 'TIMESTAMP')?.map((s1, s1ind) => ({ label: s1.name, value: s1.name, data: s1 }));
    if (res != null) {
      res = _.sortBy(res, ['value']);
    }
    return res;
  }, [featureGroupOneForFeatures]);

  const editRefAlready = useRef(false);
  useEffect(() => {
    if (editRefAlready.current) {
      return;
    }

    if (isEdit) {
      if (featureGroupOne?.transformConfig != null && optionsFeatureNames != null) {
        editRefAlready.current = true;

        let config1 = featureGroupOne?.transformConfig;

        if (config1?.transformType === TransformTypeFG.PIVOT) {
          setTypeSel(TransformTypeFG.PIVOT);
          form.setFieldsValue({
            tableName: featureGroupOne?.tableName,

            lastNvalue: config1?.numVersions,
          });
        }

        if (config1?.transformType === TransformTypeFG.UNPIVOT) {
          setTypeSel(TransformTypeFG.UNPIVOT);

          form.setFieldsValue({
            tableName: featureGroupOne?.tableName,

            unpivotExclude: config1?.exclude,
            unpivotColumns: config1?.columns,
            unpivotIndexColumn: config1?.indexColumn,
            unpivotValueColumn: config1?.valueColumn,
          });
        }
      }
    }
  }, [isEdit, featureGroupOne, optionsFeatureNames]);

  return (
    <div style={{ margin: '30px auto', maxWidth: '900px', color: Utils.colorA(1) }}>
      <Card style={{ boxShadow: '0 0 4px rgba(0,0,0,0.2)', border: '1px solid ' + Utils.colorA(0.5), backgroundColor: Utils.colorA(0.04), borderRadius: '5px' }} className={sd.grayPanel}>
        {/*// @ts-ignore*/}
        <Spin spinning={isProcessing} size={'large'}>
          <FormExt layout={'vertical'} form={form} onFinish={handleSubmit} initialValues={{}}>
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
                {isEdit ? 'Edit' : 'Create'} Transform Feature Group
              </div>

              <Form.Item
                name={'tableName'}
                rules={isEdit ? undefined : [{ required: true, message: 'Required!' }]}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Transformed Feature Group Table Name:
                    <HelpIcon id={'transformFG_tableName'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
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

            {/*<Form.Item label={<span style={{ color: Utils.isDark() ? 'white' : 'black', }}>Input Feature Group Name:</span>}>*/}
            {/*  <Input autoComplete={'off'} value={featureGroupOne?.tableName} disabled={true} />*/}
            {/*</Form.Item>*/}

            <Form.Item
              label={
                <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                  Transform Config:
                  <HelpIcon id={'transformFG_config'} style={{ marginLeft: '4px' }} />
                </span>
              }
            >
              <SelectExt onChange={onChangeTransformConfigOption} value={optionsTransformConfig?.find((o1) => o1.value === typeSel)} options={optionsTransformConfig} menuPortalTarget={popupContainerForMenu(null)} />
            </Form.Item>

            {typeSel === TransformTypeFG.PIVOT && (
              <div>
                <Form.Item
                  name={'lastNvalue'}
                  rules={[{ required: true, message: 'Required!' }]}
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      N Last versions to merge:
                      <HelpIcon id={'transformFG_pivotColumns'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <InputNumber style={{ width: '100%' }} min={1} max={999} step={1} precision={0} />
                </Form.Item>
              </div>
            )}

            {typeSel === TransformTypeFG.UNPIVOT && (
              <div>
                <Form.Item
                  valuePropName={'checked'}
                  name={'unpivotExclude'}
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      Exclude:
                      <HelpIcon id={'transformFG_unpivotExclude'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <Checkbox />
                </Form.Item>

                <Form.Item
                  name={'unpivotColumns'}
                  rules={[{ required: true, message: 'Required!' }]}
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      Choose Column to Transpose:
                      <HelpIcon id={'transformFG_unpivotColumns'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <TagsSelectExt addName={'Add'} options={optionsFeatureNames} />
                </Form.Item>

                <Form.Item
                  name={'unpivotIndexColumn'}
                  rules={[{ required: true, message: 'Required!' }]}
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      New Index Column Name:
                      <HelpIcon id={'transformFG_unpivotIndexColumn'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <Input style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  name={'unpivotValueColumn'}
                  rules={[{ required: true, message: 'Required!' }]}
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      New Value Column Name:
                      <HelpIcon id={'transformFG_unpivotValueColumn'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <Input style={{ width: '100%' }} />
                </Form.Item>
              </div>
            )}

            <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>
            <div style={{ textAlign: 'center' }}>
              <Button type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: '16px' }}>
                {isEdit ? 'Save' : 'Create Transform Feature Group'}
              </Button>
            </div>
          </FormExt>
        </Spin>
      </Card>
    </div>
  );
});

export default FeatureGroupsTransform;
