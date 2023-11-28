import Button from 'antd/lib/button';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import InputNumber from 'antd/lib/input-number';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import monitoring from '../../stores/reducers/monitoring';
import FormExt from '../FormExt/FormExt';
import { AlertsTypesList } from '../ModelMonitorAlerts/ModelMonitorAlerts';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TagsSelectExt from '../TagsSelectExt/TagsSelectExt';
const s = require('./ModelMonitorAlertsAdd.module.css');
const sd = require('../antdUseDark.module.css');

interface IModelMonitorAlertsAddProps {}

const ModelMonitorAlertsAdd = React.memo((props: PropsWithChildren<IModelMonitorAlertsAddProps>) => {
  const { paramsProp, authUser, monitoringParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    monitoringParam: state.monitoring,
  }));

  const projectId = paramsProp?.get('projectId');
  let modelMonitorId = paramsProp?.get('modelMonitorId');
  if (modelMonitorId === '-') {
    modelMonitorId = null;
  }
  let editName = paramsProp?.get('editName');
  if (editName === '') {
    editName = null;
  }

  const [featuresList, setFeaturesList] = useState(null);
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [summary, setSummary] = useState(
    null as {
      targetColumn?: string;
      predictionDrift?: number;
      featureIndex: { distance; name: string; noOutliers }[];
      nullViolations: { name: string; predictionNullFreq; trainingNullFreq; violation: string }[];
      rangeViolations: { name: string; freqAboveTrainingRange; freqBelowTrainingRange; predictionMax; predictionMin; trainingMax; trainingMin }[];
      typeViolations: { name: string; predictionDataType: string; trainingDataType: string }[];
      catViolations?: { freqOutsideTrainingRange: number; mostCommonValues: any[]; name }[];
      nestedSummary?: any[];
    },
  );
  const [metric, setMetric] = useState('fd');
  const [step, setStep] = useState(0);
  const [form] = Form.useForm();

  const optionsTypes = useMemo(() => {
    return AlertsTypesList;
  }, []);

  useEffect(() => {
    monitoring.memModelsById(true, modelMonitorId);
  }, [modelMonitorId, monitoringParam]);
  const monitorOne = useMemo(() => {
    return monitoring.memModelsById(false, modelMonitorId);
  }, [modelMonitorId, monitoringParam]);

  // useEffect(() => {
  //   monitoring.memModelVersionsById(true, modelMonitorId);
  // }, [modelMonitorId, monitoringParam]);
  // const monitorVersionsOne = useMemo(() => {
  //   return monitoring.memModelVersionsById(false, modelMonitorId);
  // }, [modelMonitorId, monitoringParam]);

  const modelMonitorVersion = useMemo(() => {
    return monitorOne?.latestMonitorModelVersion?.modelMonitorVersion;
  }, [monitorOne]);

  useEffect(() => {
    if (!modelMonitorVersion) {
      return;
    }

    REClient_.client_()._getFeatureDriftModelMonitorSummary(modelMonitorVersion, (err, res) => {
      if (err || !res?.success) {
        setSummary(null);
      } else {
        setSummary(res?.result ?? null);
      }
    });
  }, [modelMonitorVersion]);

  const getMergedFeatureIndex = (featureIndex, nestedSummary) => {
    let mergedFeatureIndex = [...featureIndex];
    nestedSummary?.forEach((nestedItem) => {
      mergedFeatureIndex.push(
        ...nestedItem.featureIndex?.map((featureItem) => {
          return { ...featureItem, name: `${nestedItem.nestedFeatureName};${featureItem.name}` };
        }),
      );
    });

    return mergedFeatureIndex;
  };

  const optionsFeatures = useMemo(() => {
    const featureIndex = getMergedFeatureIndex(summary?.featureIndex ?? [], summary?.nestedSummary ?? []);
    let res = featureIndex?.map((f1) => ({ label: f1.name, value: f1.name, data: f1 }));
    return res;
  }, [summary]);

  const handleSubmit = (values) => {
    setStep((step1) => {
      if (step1 === 0) {
        step1 = 1;
      } else {
        if (modelMonitorId == null) {
          Location.push('/' + PartsLink.monitor_alerts + '/-/' + projectId);
          return;
        }

        setMetric((m1) => {
          setFeaturesList((fl) => {
            let configInt: any = {
              metric: m1,
              features: fl,

              valueThreshold: values.valueThreshold,
              valueDriftExceed: values.valueDriftExceed,
              valueNullViolationExceed: values.valueNullViolationExceed,
              valueRangeViolationExceed: values.valueRangeViolationExceed,
              valueCategoricalRangeViolationExceed: values.valueCategoricalRangeViolationExceed,
              valueTypeMismatchViolationsExceed: values.valueTypeMismatchViolationsExceed,
              valueOutliersViolationsExceed: values.valueOutliersViolationsExceed,
            };

            let config1 = {
              config: configInt,
              name: values.name,
            };

            REClient_.client_().setModelMonitorAlertConfig(modelMonitorId, values.name, config1, (err, res) => {
              if (err || !res?.success) {
                REActions.addNotificationError(err || Constants.errorDefault);
              } else {
                StoreActions.listMonitoringModels_(projectId);
                StoreActions.describeModelMonitorById_(modelMonitorId);

                Location.push('/' + PartsLink.monitor_alerts + '/' + modelMonitorId + '/' + projectId);
              }
            });

            return fl;
          });

          return m1;
        });
      }
      return step1;
    });
  };

  const onChangeType = (option1) => {
    setMetric(option1?.value);
  };

  const onClickBack = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setStep(0);
  };

  useEffect(() => {
    if (optionsFeatures != null && optionsTypes != null) {
      let values: any = monitorOne?.alertConfig?.[editName]?.config ?? {};

      let vals: any = {
        name: editName,

        metric: optionsTypes?.find((f1) => f1.value === (values.metric || 'fd')),
        features: values.features,

        valueThreshold: values.valueThreshold,
        valueDriftExceed: values.valueDriftExceed,
        valueNullViolationExceed: values.valueNullViolationExceed,
        valueRangeViolationExceed: values.valueRangeViolationExceed,
        valueCategoricalRangeViolationExceed: values.valueCategoricalRangeViolationExceed,
        valueTypeMismatchViolationsExceed: values.valueTypeMismatchViolationsExceed,
        valueOutliersViolationsExceed: values.valueOutliersViolationsExceed,
      };
      setTimeout(() => {
        setMetric(values.metric ?? 'fd');
        setFeaturesList(values.features ?? null);

        form?.setFieldsValue(vals);
      }, 0);
    }
  }, [optionsFeatures, optionsTypes, monitorOne, editName]);

  const onChangeFeatures = (value) => {
    setFeaturesList(value);
  };

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
                Create Alert
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
                onFinish={handleSubmit}
                initialValues={{}}
              >
                <div
                  css={`
                    display: ${step === 0 ? 'block' : 'none'};
                  `}
                >
                  <Form.Item
                    rules={[{ required: true, message: 'Required!' }]}
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
                    <Input disabled={editName != null} />
                  </Form.Item>

                  <Form.Item
                    name={'metric'}
                    label={
                      <span
                        css={`
                          color: white;
                        `}
                      >
                        Metric
                      </span>
                    }
                  >
                    <SelectExt options={optionsTypes} onChange={onChangeType} />
                  </Form.Item>

                  {optionsFeatures != null && metric !== 'md' && (
                    <Form.Item
                      name={'feature'}
                      label={
                        <span
                          css={`
                            color: white;
                          `}
                        >
                          Feature
                        </span>
                      }
                    >
                      <TagsSelectExt addName={'Add Feature'} options={optionsFeatures} onChange={onChangeFeatures} value={featuresList} />;
                    </Form.Item>
                  )}
                </div>

                <div
                  css={`
                    display: ${step === 1 ? 'block' : 'none'};
                  `}
                >
                  {
                    <Form.Item
                      name={'valueThreshold'}
                      label={
                        <span
                          css={`
                            color: white;
                          `}
                        >
                          Threshold Metric
                        </span>
                      }
                    >
                      <InputNumber min={0} max={999999} />
                    </Form.Item>
                  }

                  {(metric === 'md' || metric === 'fd') && (
                    <Form.Item
                      name={'valueDriftExceed'}
                      label={
                        <span
                          css={`
                            color: white;
                          `}
                        >
                          Drift Exceed
                        </span>
                      }
                    >
                      <InputNumber min={0} max={999999} />
                    </Form.Item>
                  )}

                  {metric === 'di' && (
                    <Form.Item
                      name={'valueNullViolationExceed'}
                      label={
                        <span
                          css={`
                            color: white;
                          `}
                        >
                          Null Violations Exceed
                        </span>
                      }
                    >
                      <InputNumber min={0} max={999999} />
                    </Form.Item>
                  )}

                  {metric === 'di' && (
                    <Form.Item
                      name={'valueRangeViolationExceed'}
                      label={
                        <span
                          css={`
                            color: white;
                          `}
                        >
                          Range Violations Exceed
                        </span>
                      }
                    >
                      <InputNumber min={0} max={999999} />
                    </Form.Item>
                  )}

                  {metric === 'di' && (
                    <Form.Item
                      name={'valueCategoricalRangeViolationExceed'}
                      label={
                        <span
                          css={`
                            color: white;
                          `}
                        >
                          Categorical Range Violations Exceed
                        </span>
                      }
                    >
                      <InputNumber min={0} max={999999} />
                    </Form.Item>
                  )}

                  {metric === 'di' && (
                    <Form.Item
                      name={'valueTypeMismatchViolationsExceed'}
                      label={
                        <span
                          css={`
                            color: white;
                          `}
                        >
                          Type Mismatch Violations Exceed
                        </span>
                      }
                    >
                      <InputNumber min={0} max={999999} />
                    </Form.Item>
                  )}

                  {metric === 'ou' && (
                    <Form.Item
                      name={'valueOutliersViolationsExceed'}
                      label={
                        <span
                          css={`
                            color: white;
                          `}
                        >
                          Outliers Violations Exceed
                        </span>
                      }
                    >
                      <InputNumber min={0} max={999999} />
                    </Form.Item>
                  )}
                </div>

                <Form.Item style={{ marginBottom: '1px', marginTop: '16px' }}>
                  <div style={{ borderTop: '1px solid #23305e', margin: '4px -22px' }}></div>
                  <div
                    css={`
                      display: flex;
                    `}
                  >
                    {step === 1 && (
                      <Button type="default" onClick={onClickBack} style={{ marginTop: '16px', marginRight: '5px' }}>
                        Back
                      </Button>
                    )}
                    <Button type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: '16px', flex: '1' }}>
                      {step === 0 ? 'Next' : 'Set'}
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

export default ModelMonitorAlertsAdd;
