import Button from 'antd/lib/button';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useFeatureGroup } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import FormExt from '../FormExt/FormExt';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import { OPTypesList } from '../FeatureGroupsConstraint/FeatureGroupsConstraint';
import { InputNumber } from 'antd';
const s = require('./FeatureGroupConstraintsAdd.module.css');
const sd = require('../antdUseDark.module.css');

interface IFeatureGroupConstraintsAddProps {}

const FeatureGroupConstraintsAdd = React.memo((props: PropsWithChildren<IFeatureGroupConstraintsAddProps>) => {
  const { paramsProp } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    monitoringParam: state.monitoring,
  }));

  const projectId = paramsProp?.get('projectId');
  let featureGroupId = paramsProp?.get('featureGroupId');
  const featureOne = useFeatureGroup(projectId, featureGroupId);

  if (featureGroupId === '-') {
    featureGroupId = null;
  }
  let isEditIndex = paramsProp?.get('constraintEdit');
  if (isEditIndex === '') {
    isEditIndex = null;
  }

  const [optionsConfigValues, setOptionsConfigValues] = useState(null);
  const optionsTypes = useMemo(() => {
    return OPTypesList.map((a1) => ({ label: a1.label, value: a1.operator, data: a1 }));
  }, []);

  const enforcementList = [
    { label: 'HARD', value: 'HARD', data: 'HARD' },
    { label: 'SOFT', value: 'SOFT', data: 'SOFT' },
  ];

  const [form] = Form.useForm();

  useEffect(() => {
    if (isEditIndex) {
      let vals: any = {
        name: featureOne?.name || '',
        code: featureOne?.projectConfig?.constraints?.[isEditIndex]?.code,
        penalty: featureOne?.projectConfig?.constraints?.[isEditIndex]?.penalty,
        enforcement: featureOne?.projectConfig?.constraints?.[isEditIndex]?.enforcement,
        operator: optionsTypes?.find((f1) => f1?.value === featureOne?.projectConfig?.constraints?.[isEditIndex]?.operator),
        constant: featureOne?.projectConfig?.constraints?.[isEditIndex]?.constant,
      };
      form?.setFieldsValue(vals);
    }
  }, [featureOne]);

  const handleSubmit = (values) => {
    let cb1 = (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
        Location.push('/' + PartsLink.feature_groups_constraint + '/' + projectId + '/' + featureGroupId);
      }
    };

    REClient_.client_().setProjectFeatureGroupConfig(
      featureGroupId,
      projectId,
      { type: 'CONSTRAINTS', constraints: [{ operator: values?.operator?.value, enforcement: values?.enforcement?.value, constant: values?.constant, code: values?.code, penalty: values?.penalty }] },
      cb1,
    );
  };

  const optionsConfigOnValuesChange = useCallback((values) => {
    setOptionsConfigValues((vv) => {
      vv = _.assign({}, vv ?? {}, values ?? {});

      return vv;
    });
  }, []);

  return (
    <div
      css={`
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
      `}
    >
      <NanoScroller onlyVertical>
        <div style={{ margin: '30px auto', maxWidth: '800px', color: Utils.colorA(1) }}>
          <RefreshAndProgress isRelative>
            <div style={{ color: 'white', padding: '20px 23px' }} className={sd.grayPanel}>
              <div
                css={`
                  font-family: Matter;
                  font-size: 24px;
                  line-height: 1.33;
                  color: #ffffff;
                `}
              >
                {isEditIndex ? 'Edit Constraint' : 'Create Constraint'}
              </div>
              <div
                css={`
                  border-top: 1px solid white;
                  margin-top: 10px;
                  margin-bottom: 15px;
                `}
              ></div>

              <FormExt
                form={form}
                css={`
                  font-family: Roboto;
                  font-size: 14px;
                  letter-spacing: 1.31px;
                  color: #ffffff;
                `}
                layout={'vertical'}
                onValuesChange={optionsConfigOnValuesChange}
                onFinish={handleSubmit}
              >
                <div
                  css={`
                    display: ${'block'};
                  `}
                >
                  <Form.Item
                    name={'name'}
                    label={
                      <span
                        css={`
                          color: white;
                        `}
                      >
                        Name
                      </span>
                    }
                  >
                    <Input disabled={false && isEditIndex != null} />
                  </Form.Item>
                  <Form.Item
                    name={'code'}
                    label={
                      <span
                        css={`
                          color: white;
                        `}
                      >
                        Code
                      </span>
                    }
                  >
                    <Input disabled={false && isEditIndex != null} />
                  </Form.Item>
                  <Form.Item
                    name={'penalty'}
                    label={
                      <span
                        css={`
                          color: white;
                        `}
                      >
                        Penalty
                      </span>
                    }
                  >
                    <InputNumber style={{ width: '100%' }} disabled={false && isEditIndex != null} />
                  </Form.Item>

                  <Form.Item
                    rules={[{ required: true, message: 'Required!' }]}
                    name={'operator'}
                    label={
                      <span
                        css={`
                          color: white;
                        `}
                      >
                        OP
                      </span>
                    }
                  >
                    <SelectExt options={optionsTypes} />
                  </Form.Item>
                  <Form.Item
                    rules={[{ required: true, message: 'Required!' }]}
                    name={'enforcement'}
                    label={
                      <span
                        css={`
                          color: white;
                        `}
                      >
                        Enforcement
                      </span>
                    }
                  >
                    <SelectExt options={enforcementList} />
                  </Form.Item>
                </div>
                <Form.Item
                  rules={[{ required: true, message: 'Required!' }]}
                  name={'constant'}
                  label={
                    <span
                      css={`
                        color: white;
                      `}
                    >
                      Constant
                    </span>
                  }
                >
                  <InputNumber style={{ width: '100%' }} disabled={false && isEditIndex != null} />
                </Form.Item>
                <Form.Item style={{ marginBottom: '1px', marginTop: '16px' }}>
                  <div style={{ borderTop: '1px solid #23305e', margin: '4px -22px' }}></div>
                  <div
                    css={`
                      display: flex;
                    `}
                  >
                    <Button type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: '16px', flex: '1' }}>
                      {isEditIndex ? 'Save' : 'Create'}
                    </Button>
                  </div>
                </Form.Item>
              </FormExt>
            </div>
          </RefreshAndProgress>
        </div>
      </NanoScroller>
    </div>
  );
});

export default FeatureGroupConstraintsAdd;
