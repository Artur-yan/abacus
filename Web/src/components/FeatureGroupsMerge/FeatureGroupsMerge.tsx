import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Col from 'antd/lib/col';
import Collapse from 'antd/lib/collapse';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import InputNumber from 'antd/lib/input-number';
import Row from 'antd/lib/row';
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
const s = require('./FeatureGroupsMerge.module.css');
const sd = require('../antdUseDark.module.css');
const { Panel } = Collapse;

enum MergeTypeFG {
  LAST_N = 'LAST_N',
  TIME_WINDOW = 'TIME_WINDOW',
}

interface IFeatureGroupsMergeProps {}

const FeatureGroupsMerge = React.memo((props: PropsWithChildren<IFeatureGroupsMergeProps>) => {
  const { paramsProp, featureGroupsParam, projectsParam, useCasesParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    featureGroupsParam: state.featureGroups,
    useCasesParam: state.useCases,
    projectsParam: state.projects,
  }));

  const [typeSel, setTypeSel] = useState(MergeTypeFG.LAST_N);

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

  const optionsTimes = useMemo(() => {
    return [
      {
        label: 'Days',
        value: 24 * 60 * 60 * 1000,
      },
      {
        label: 'Hours',
        value: 60 * 60 * 1000,
      },
      {
        label: 'Minutes',
        value: 60 * 1000,
      },
      {
        label: 'Seconds',
        value: 1000,
      },
      {
        label: 'Milliseconds',
        value: 1,
      },
    ];
  }, []);

  useEffect(() => {
    featureGroups.memFeatureGroupsForId(true, null, featureGroupId);
  }, [featureGroupsParam, featureGroupId]);
  const featureGroupOne = useMemo(() => {
    return featureGroups.memFeatureGroupsForId(false, null, featureGroupId);
  }, [featureGroupsParam, featureGroupId]);

  const handleSubmit = (values) => {
    let vv: any = {};

    switch (typeSel) {
      case MergeTypeFG.LAST_N:
        vv = { mergeMode: 'LAST_N', numVersions: values.lastNvalue };
        break;

      case MergeTypeFG.TIME_WINDOW:
        let time1 = (values.timeType?.value ?? 1) * values.timeWindowSizeMsTW;
        vv = { mergeMode: 'TIME_WINDOW', featureName: values.featureNameTW?.value, timeWindowSizeMs: time1 };
        break;
    }

    //
    if (isEdit) {
      REClient_.client_().setFeatureGroupMergeConfig(featureGroupId, vv, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          if (projectId) {
            StoreActions.getProjectsById_(projectId);
            StoreActions.featureGroupsGetByProject_(projectId);

            StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
          }
          StoreActions.featureGroupsDescribe_(null, featureGroupId);

          Location.push('/' + PartsLink.feature_group_detail + '/' + (projectId ?? '-') + '/' + featureGroupId);
        }
      });
    } else {
      REClient_.client_().createMergeFeatureGroup(featureGroupId, values.tableName, vv, null, null, null, projectId, (err, res) => {
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

  const optionsMergeConfig = useMemo(() => {
    return [
      {
        label: 'Last-N',
        value: MergeTypeFG.LAST_N,
      },
      {
        label: 'TimeWindow',
        value: MergeTypeFG.TIME_WINDOW,
      },
    ];
  }, []);

  const onChangeMergeConfigOption = (option1) => {
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
      if (featureGroupOne?.mergeConfig != null && optionsFeatureNames != null) {
        editRefAlready.current = true;

        let config1 = featureGroupOne?.mergeConfig;

        if (config1?.mergeMode === MergeTypeFG.LAST_N) {
          setTypeSel(MergeTypeFG.LAST_N);
          form.setFieldsValue({
            tableName: featureGroupOne?.tableName,

            lastNvalue: config1?.numVersions,
          });
        }

        if (config1?.mergeMode === MergeTypeFG.TIME_WINDOW) {
          setTypeSel(MergeTypeFG.TIME_WINDOW);

          let time1 = config1?.timeWindowSizeMs;

          let optionsTimesSel = 1;
          if (time1 != null && time1 > 0) {
            optionsTimes?.some((o1) => {
              let r1 = time1 - Math.trunc(time1 / o1.value) * o1.value;
              if (r1 === 0) {
                time1 = time1 / o1.value;
                optionsTimesSel = o1.value;
                return true;
              }
            });
          }

          form.setFieldsValue({
            tableName: featureGroupOne?.tableName,

            featureNameTW: optionsFeatureNames?.find((o1) => o1.value === config1?.featureName),
            timeWindowSizeMsTW: time1,
            timeType: optionsTimes?.find((o1) => o1.value === optionsTimesSel),
          });
        }
      }
    }
  }, [isEdit, featureGroupOne, optionsFeatureNames, optionsTimes]);

  return (
    <div style={{ margin: '30px auto', maxWidth: '600px', color: Utils.colorA(1) }}>
      <Card style={{ boxShadow: '0 0 4px rgba(0,0,0,0.2)', border: '1px solid ' + Utils.colorA(0.5), backgroundColor: Utils.colorA(0.04), borderRadius: '5px' }} className={sd.grayPanel}>
        {/*// @ts-ignore*/}
        <Spin spinning={isProcessing} size={'large'}>
          <FormExt layout={'vertical'} form={form} onFinish={handleSubmit} initialValues={{ lastNvalue: 1, timeWindowSizeMsTW: 60 * 60 * 1000, timeType: optionsTimes?.find((o1) => o1.value === 1) }}>
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
                {isEdit ? 'Edit' : 'Create'} Merge Feature Group
              </div>

              <Form.Item
                name={'tableName'}
                rules={isEdit ? undefined : [{ required: true, message: 'Required!' }]}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Merge Feature Group Table Name: <HelpIcon id={'merge_fg_tablename'} style={{ marginLeft: 4 }} />
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
                  Merge Config: <HelpIcon id={'merge_fg_config'} style={{ marginLeft: 4 }} />
                </span>
              }
            >
              <SelectExt onChange={onChangeMergeConfigOption} value={optionsMergeConfig?.find((o1) => o1.value === typeSel)} options={optionsMergeConfig} menuPortalTarget={popupContainerForMenu(null)} />
            </Form.Item>

            {typeSel === MergeTypeFG.LAST_N && (
              <div>
                <Form.Item
                  name={'lastNvalue'}
                  rules={[{ required: true, message: 'Required!' }]}
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      Number of Feature Group versions to merge: <HelpIcon id={'merge_fg_lastN_num'} style={{ marginLeft: 4 }} />
                    </span>
                  }
                >
                  <InputNumber style={{ width: '100%' }} min={0} max={999} step={1} precision={0} />
                </Form.Item>
              </div>
            )}

            {typeSel === MergeTypeFG.TIME_WINDOW && (
              <div>
                <Form.Item
                  name={'featureNameTW'}
                  rules={[{ required: true, message: 'Required!' }]}
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      Choose Timestamp Column: <HelpIcon id={'merge_fg_timestamp_col'} style={{ marginLeft: 4 }} />
                    </span>
                  }
                >
                  <SelectExt options={optionsFeatureNamesTimestamp ?? Utils.emptyStaticArray()} />
                </Form.Item>

                <Row style={{ width: '100%' }}>
                  <Col style={{ width: '60%' }}>
                    <Form.Item
                      name={'timeWindowSizeMsTW'}
                      rules={[{ required: true, message: 'Required!' }]}
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          How far back in time: <HelpIcon id={'merge_fg_time_duration'} style={{ marginLeft: 4 }} />
                        </span>
                      }
                    >
                      <InputNumber style={{ width: '100%' }} min={1} max={999999999} step={1} precision={0} />
                    </Form.Item>
                  </Col>
                  <Col style={{ width: '40%', paddingLeft: '10px' }}>
                    <Form.Item
                      name={'timeType'}
                      rules={[{ required: true, message: 'Required!' }]}
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Unit: <HelpIcon id={'merge_fg_time_unit'} style={{ marginLeft: 4 }} />
                        </span>
                      }
                    >
                      <SelectExt options={optionsTimes} />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            )}

            <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>
            <div style={{ textAlign: 'center' }}>
              <Button type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: '16px' }}>
                {isEdit ? 'Save' : 'Create Merge Feature Group'}
              </Button>
            </div>
          </FormExt>
        </Spin>
      </Card>
    </div>
  );
});

export default FeatureGroupsMerge;
