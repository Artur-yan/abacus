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
import { useModelMonitor, useMonitorsAlertOne } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import { AlertsTypesList } from '../ModelMonitorAlertsNew/ModelMonitorAlertsNew';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import OptionsBuilder from '../OptionsBuilder/OptionsBuilder';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TagsSelectExt from '../TagsSelectExt/TagsSelectExt';
const s = require('./ModelMonitorAlertsAddNew.module.css');
const sd = require('../antdUseDark.module.css');

interface IModelMonitorAlertsAddNewProps {}

const ModelMonitorAlertsAddNew = React.memo((props: PropsWithChildren<IModelMonitorAlertsAddNewProps>) => {
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
  let monitorAlertId = paramsProp?.get('monitorAlertId');
  if (monitorAlertId === '') {
    monitorAlertId = null;
  }

  const [orgUsers, setOrgUsers] = useState(null);
  const [optionsConfigValues, setOptionsConfigValues] = useState(null);
  const optionsTypes = useMemo(() => {
    return AlertsTypesList.map((a1) => ({ label: a1.label, value: a1.alert_type, data: a1 }));
  }, []);

  const [optionsConfigValuesInit, setOptionsConfigValuesInit] = useState({
    metric: optionsTypes?.[0],
  });

  const [ignoredFormOptions, forceUpdateFormOptions] = useReducer((x) => x + 1, 0);
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [metric, setMetric] = useState(optionsTypes?.[0]?.value ?? null);
  const [form] = Form.useForm();
  const [formOptionsSel, setFormOptionsSel] = useState(null);

  const monitorOne = useModelMonitor(modelMonitorId);
  const alertOne = useMonitorsAlertOne(monitorAlertId);

  const handleSubmit = (values) => {
    let actionEmail = values.actionEmail ?? [];
    setMetric((m1) => {
      let config1 = {
        alert_type: m1,
      };

      let actionConfig: any = {};

      if (!Utils.isNullOrEmpty(actionEmail)) {
        actionConfig = _.assign({}, actionConfig ?? {}, {
          action_type: 'Email',
          email_recipients: actionEmail,
          additional_info: null,
        });
      }

      setOptionsConfigValues((configValues) => {
        let cc = { ...(configValues ?? {}) };

        delete cc.actionEmail;
        delete cc.name;
        let sendConfig = _.assign({}, config1, cc);

        let configKeys = Object.keys(sendConfig ?? {});
        configKeys?.some((configKey) => {
          if (sendConfig?.[configKey]?.value != null) {
            sendConfig[configKey] = sendConfig[configKey].value;
          }
        });

        let cb1 = (err, res) => {
          if (err || !res?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            StoreActions.describeMonitorAlert_(monitorAlertId);

            Location.push('/' + PartsLink.monitors_alert_list + '/' + modelMonitorId + '/' + projectId);
          }
        };

        if (monitorAlertId) {
          REClient_.client_().updateMonitorAlert(monitorAlertId, values.name, sendConfig, actionConfig, cb1);
        } else {
          REClient_.client_().createMonitorAlert(projectId, modelMonitorId, values.name, sendConfig, actionConfig, cb1);
        }

        return configValues;
      });

      return m1;
    });
  };

  const onChangeType = (option1) => {
    setMetric(option1?.value);
  };

  const optionsEmails = useMemo(() => {
    let res = orgUsers?.filter((u1) => u1?.emailValidated === true)?.map((u1) => ({ label: '' + u1.email, value: u1.email })) ?? [];
    if (res != null) {
      res = _.sortBy(res, 'label');
      res.unshift({ label: 'None', value: null });
    }

    return res;
  }, [orgUsers]);

  useEffect(() => {
    if (optionsTypes != null && alertOne != null && optionsEmails != null) {
      let vals: any = {
        name: alertOne?.name || '',
        metric: optionsTypes?.find((f1) => f1.value === alertOne?.conditionConfig?.alert_type),
        actionEmail: alertOne?.actionConfig?.emailRecipients ?? alertOne?.actionConfig?.email_recipients ?? [],
      };
      if (vals.actionEmail != null && !_.isArray(vals.actionEmail)) {
        vals.actionEmail = [];
      }

      let cf1 = alertOne?.conditionConfig ?? {};
      cf1 = { ...cf1 };
      delete cf1.alert_type;
      vals = _.assign(vals, cf1);

      let kk = Object.keys(vals ?? {});
      kk.some((k1) => {
        let data1 = vals.metric?.data;
        let options1 = data1?.options?.[k1]?.options;
        if (options1?.values != null) {
          let v1 = vals[k1];
          let ind1 = _.findIndex(options1?.values, (o1) => o1 == v1);
          vals[k1] = ind1 > -1 ? { label: options1?.names?.[ind1] ?? options1?.values?.[ind1], value: options1?.values?.[ind1] } : null;
        }
      });

      setTimeout(() => {
        setMetric(alertOne?.conditionConfig?.alert_type);

        form?.setFieldsValue(vals);
      }, 0);
    }
  }, [optionsTypes, alertOne, optionsEmails]);

  useEffect(() => {
    if (!metric) {
      setFormOptionsSel(null);
      return;
    }

    setFormOptionsSel(optionsTypes?.find((o1) => o1.value === metric)?.data?.options);
  }, [optionsTypes, metric]);

  useEffect(() => {
    setTimeout(() => {
      forceUpdateFormOptions();
    }, 0);
  }, [formOptionsSel]);

  const optionsGetCall = useCallback(
    (cbFinish) => {
      cbFinish?.(null, { success: true, result: formOptionsSel });
    },
    [formOptionsSel],
  );

  const optionsConfigOnValuesChange = useCallback((values) => {
    setOptionsConfigValues((vv) => {
      vv = _.assign({}, vv ?? {}, values ?? {});

      return vv;
    });
  }, []);

  const optionsConfigSetFieldsValue = useCallback(
    (values) => {
      setOptionsConfigValues(values);

      if (!monitorAlertId) {
        setTimeout(() => {
          form?.setFieldsValue(values);
        }, 0);
      }
    },
    [form, monitorAlertId],
  );

  const onChangeForm = useCallback((values) => {}, [form]);

  const formForceRefresh = useCallback(() => {
    forceUpdate();
  }, []);

  useEffect(() => {
    REClient_.client_().listOrganizationUsers((err, res) => {
      setOrgUsers(res?.result ?? []);
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
                {monitorAlertId ? 'Edit Alert' : 'Create Alert'}
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
                initialValues={optionsConfigValuesInit}
              >
                <div
                  css={`
                    display: ${'block'};
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
                    <Input disabled={false && monitorAlertId != null} />
                  </Form.Item>

                  <Form.Item
                    rules={[{ required: true, message: 'Required!' }]}
                    name={'metric'}
                    label={
                      <span
                        css={`
                          color: white;
                        `}
                      >
                        Metric
                        <HelpIcon id={'monitor_alerts_metrics'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <SelectExt options={optionsTypes} onChange={onChangeType} />
                  </Form.Item>
                </div>

                <OptionsBuilder
                  helpIdPrefix={'monitor_alerts'}
                  onChangeForm={onChangeForm}
                  formForceRefresh={formForceRefresh}
                  id={'' + ignoredFormOptions}
                  form={form}
                  projectId={projectId}
                  setFieldsValue={optionsConfigSetFieldsValue}
                  optionsGetCall={optionsGetCall}
                  initialValues={null}
                />

                <Form.Item
                  name={'actionEmail'}
                  label={
                    <span
                      css={`
                        color: white;
                      `}
                    >
                      Action Email:
                    </span>
                  }
                >
                  <TagsSelectExt addName={'Add Recipient'} options={optionsEmails} />
                </Form.Item>

                <Form.Item style={{ marginBottom: '1px', marginTop: '16px' }}>
                  <div style={{ borderTop: '1px solid #23305e', margin: '4px -22px' }}></div>
                  <div
                    css={`
                      display: flex;
                    `}
                  >
                    <Button type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: '16px', flex: '1' }}>
                      {monitorAlertId ? 'Save' : 'Create'}
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

export default ModelMonitorAlertsAddNew;
