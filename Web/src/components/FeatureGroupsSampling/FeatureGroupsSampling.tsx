import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import InputNumber from 'antd/lib/input-number';
import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import { useEditGroup, useFeatureGroupId, useProjectId } from '../../stores/hooks';
import featureGroups from '../../stores/reducers/featureGroups';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import PartsLink from '../NavLeft/PartsLink';
import SelectExt from '../SelectExt/SelectExt';
import TagsSelectExt from '../TagsSelectExt/TagsSelectExt';
const styles = require('./FeatureGroupsSampling.module.css');
const sd = require('../antdUseDark.module.css');

const useFeatureGroup = (featureGroupId) => {
  const { featureGroupsParam } = useSelector((state: any) => ({
    featureGroupsParam: state.featureGroups,
  }));

  const featureGroup = useMemo(() => {
    return featureGroups.memFeatureGroupsForId(false, null, featureGroupId);
  }, [featureGroupsParam, featureGroupId]);

  useEffect(() => {
    featureGroups.memFeatureGroupsForId(true, null, featureGroupId);
  }, [featureGroupsParam, featureGroupId]);

  return featureGroup;
};

const handleSubmit = async (projectId, featureGroupId, isEditing, values) => {
  const tableName = values.tableName;
  const payload: any = {
    samplingMethod: values.samplingMethod?.value,
    keyColumns: values.keyColumns,
  };
  if (payload.samplingMethod === 'PERCENT_SAMPLING') {
    payload.samplePercent = values.samplePercent;
  } else {
    payload.sampleCount = values.sampleCount;
  }
  try {
    let response: any;
    if (isEditing) {
      response = await REClient_.promises_().setFeatureGroupSamplingConfig(featureGroupId, JSON.stringify(payload));
    } else {
      response = await REClient_.promises_().createSamplingFeatureGroup(featureGroupId, tableName, JSON.stringify(payload), null, null, null, projectId);
    }
    if (!response?.success) {
      throw new Error(response?.error);
    }
    if (projectId) {
      StoreActions.getProjectsById_(projectId);
      StoreActions.featureGroupsGetByProject_(projectId);
    }
    StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
    StoreActions.featureGroupSamplingConfigOptions_(featureGroupId);
    Location.push('/' + PartsLink.feature_group_detail + '/' + (projectId ?? '-') + '/' + response?.result?.featureGroupId);
  } catch (error) {
    REActions.addNotificationError(error?.message || Constants.errorDefault);
  }
};

interface FeatureGroupsSamplingProps {}

const FeatureGroupsSampling = React.memo((props: FeatureGroupsSamplingProps) => {
  const [form] = Form.useForm();
  const [samplingConfig, setSamplingConfig] = useState([]);
  const samplingMethodOptionsRef = useRef([]);
  let projectId = useProjectId();
  if (projectId === '-') {
    projectId = null;
  }
  const isEditConfig = useEditGroup() === '1';
  const featureGroupId = useFeatureGroupId();
  const featureGroup = useFeatureGroup(featureGroupId);

  const samplingConfigOptions = useMemo(
    () =>
      samplingConfig.map((option) => ({
        label: (
          <span>
            <b>{option.name}</b>: {option.description}
          </span>
        ),
        value: option.value,
        form: option.form,
      })),
    [samplingConfig],
  );

  const keyColumnsOptions = useMemo(
    () =>
      samplingConfig?.[0]?.form?.keyColumns?.options?.values?.map?.((value) => ({
        label: value,
        value: value,
      })),
    [samplingConfig],
  );

  const initialValues = useMemo(() => {
    if (!featureGroup || !samplingConfigOptions?.length) {
      return {};
    }
    let samplingConfig = featureGroup?.samplingConfig ?? {};
    const selectedSamplingConfig = samplingConfigOptions.filter((option) => option.value === samplingConfig?.samplingMethod)[0] || samplingConfigOptions[0];
    let selectedKeyColumns = keyColumnsOptions.filter((option) => samplingConfig?.keyColumns?.includes?.(option.value)) || [];
    selectedKeyColumns = selectedKeyColumns.map((option) => option.value);
    const res = {
      sampleCount: samplingConfig?.sampleCount,
      samplePercent: samplingConfig?.samplePercent,
      keyColumns: selectedKeyColumns,
      samplingConfig: selectedSamplingConfig,
      tableName: isEditConfig ? featureGroup?.tableName : '',
      inputTableName: isEditConfig ? featureGroup?.sourceTables?.[0] : featureGroup?.tableName,
    };
    return res;
  }, [isEditConfig, featureGroup, samplingConfig, samplingConfigOptions, keyColumnsOptions]);

  const selectedSamplingConfig = Form.useWatch('samplingConfig', form);
  useEffect(() => {
    samplingMethodOptionsRef.current = selectedSamplingConfig?.form?.samplingMethod?.options?.values?.map?.((value) => ({ label: value, value }));
    form?.setFieldValue('samplingMethod', samplingMethodOptionsRef.current?.[0]);
  }, [selectedSamplingConfig]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  const getFeatureGroupSamplingConfigOptions = async () => {
    if (!featureGroupId) {
      return;
    }
    try {
      const response: any = await REClient_.promises_()._getFeatureGroupSamplingConfigOptions(featureGroupId);
      setSamplingConfig(response?.result || []);
    } catch (error) {}
  };

  useEffect(() => {
    getFeatureGroupSamplingConfigOptions();
  }, [featureGroupId]);

  const onFinish = (values) => {
    handleSubmit(projectId, featureGroupId, isEditConfig, values);
  };

  return (
    <div className={styles.container} style={{ color: Utils.colorA(1) }}>
      <Card style={{ boxShadow: '0 0 4px rgba(0,0,0,0.2)', border: '1px solid ' + Utils.colorA(0.5), backgroundColor: Utils.colorA(0.04), borderRadius: 5 }} className={sd.grayPanel}>
        <FormExt initialValues={initialValues} layout={'vertical'} form={form} onFinish={onFinish} style={{ color: 'white' }}>
          <div className={styles.title}>{`${isEditConfig ? 'Edit' : 'Create'} Sampling Feature Group`}</div>

          <div
            css={`
              margin: 5px 0 20px;
              font-size: 20px;
              color: white;
            `}
          >
            <Form.Item
              name="tableName"
              rules={[{ required: true, message: 'Required!' }]}
              label={
                <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                  Sampling Feature Group Table Name:
                  <HelpIcon id={'sample_tablename'} style={{ marginLeft: 4 }} />
                </span>
              }
            >
              <Input
                css={
                  isEditConfig
                    ? `&.ant-input.ant-input {
                    background-color: #424242 !important;
                  }`
                    : ''
                }
                disabled={isEditConfig}
                autoComplete={'off'}
              />
            </Form.Item>
          </div>
          <Form.Item
            name="inputTableName"
            rules={[{ required: true, message: 'Required!' }]}
            label={
              <span style={{ color: 'white' }}>
                Sampling Input Feature Group Name:
                <HelpIcon id={'sample_input_fg'} style={{ marginLeft: 4 }} />
              </span>
            }
          >
            <Input
              css={
                true
                  ? `&.ant-input.ant-input {
                    background-color: #424242 !important;
                  }`
                  : ''
              }
              autoComplete={'off'}
              disabled
            />
          </Form.Item>

          <Form.Item
            name="samplingConfig"
            label={
              <span style={{ color: 'white' }}>
                Sampling Config:
                <HelpIcon id={'sample_config'} style={{ marginLeft: 4 }} />
              </span>
            }
          >
            <SelectExt options={samplingConfigOptions} menuPortalTarget={document.getElementById('body2')} />
          </Form.Item>

          <Form.Item
            name="samplingMethod"
            label={
              <span style={{ color: 'white' }}>
                Sampling Method:
                <HelpIcon id={'n_sampling_trainoption_Sampling method'} style={{ marginLeft: 4 }} />
              </span>
            }
          >
            <SelectExt options={samplingMethodOptionsRef.current} menuPortalTarget={document.getElementById('body2')} />
          </Form.Item>
          <Form.Item
            name="keyColumns"
            label={
              <span style={{ color: 'white' }}>
                Key Columns:
                <HelpIcon id={'n_sampling_trainoption_Key columns'} style={{ marginLeft: 4 }} />
              </span>
            }
          >
            <TagsSelectExt options={keyColumnsOptions} />
          </Form.Item>
          {selectedSamplingConfig?.value.toUpperCase() === 'N_SAMPLING' && (
            <Form.Item
              name="sampleCount"
              rules={[{ required: true, message: 'Required' }]}
              label={
                <span style={{ color: 'white' }}>
                  Sample Count
                  <HelpIcon id={'n_sampling_trainoption_Sample count'} style={{ marginLeft: 4 }} />
                </span>
              }
            >
              <InputNumber min={0} step={0.1} precision={0} formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} style={{ width: '100%' }} />
            </Form.Item>
          )}
          {selectedSamplingConfig?.value.toUpperCase() === 'PERCENT_SAMPLING' && (
            <Form.Item
              name="samplePercent"
              rules={[{ required: true, message: 'Required' }]}
              label={
                <span style={{ color: 'white' }}>
                  Sample Fraction
                  <HelpIcon id={'percent_sampling_trainoption_Sample fraction'} style={{ marginLeft: 4 }} />
                </span>
              }
            >
              <InputNumber {...props} min={0} max={1} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
          )}
          <div style={{ borderTop: `1px solid ${Utils.colorA(0.06)}`, margin: '20px -22px 10px' }}></div>
          <div style={{ textAlign: 'center' }}>
            <Form.Item noStyle shouldUpdate>
              {() => {
                const { tableName, sampleCount, samplePercent } = form.getFieldsValue();
                const disabled = !tableName || !(sampleCount || samplePercent);
                return (
                  <Button type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: 16 }} disabled={disabled}>
                    {isEditConfig ? 'Save Sampling Config' : 'Create Sampling Feature Group'}
                  </Button>
                );
              }}
            </Form.Item>
          </div>
        </FormExt>
      </Card>
    </div>
  );
});

export default FeatureGroupsSampling;
