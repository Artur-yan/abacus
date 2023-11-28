import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Radio from 'antd/lib/radio';
import Spin from 'antd/lib/spin';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useFeatureGroup, useProject } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import featureGroups from '../../stores/reducers/featureGroups';
import DateOld from '../DateOld/DateOld';
import { calcSchemaForFeature } from '../FeaturesOneAdd/FeatureType';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import PartsLink from '../NavLeft/PartsLink';
import SelectExt from '../SelectExt/SelectExt';
import TagsSelectExt from '../TagsSelectExt/TagsSelectExt';
const s = require('./EDACreateNew.module.css');
const sd = require('../antdUseDark.module.css');

const SPECIFIC_VERSION = 'SPECIFIC_VERSION';
const LATEST_VERSION = 'LATEST_VERSION';
const N_VERSION = 'N_VERSION';

const FORECAST_FREQUENCIES = ['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];

interface IEDACreateNewProps {}

const ForcedKeys = ['TARGET', 'PREDICTED_VALUE'];

const EDACreateNew = React.memo((props: PropsWithChildren<IEDACreateNewProps>) => {
  const { paramsProp, featureGroupsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    featureGroupsParam: state.featureGroups,
  }));

  const [form] = Form.useForm();
  const [isProcessing, setIsProcessing] = useState(false);
  const [type, setType] = useState('collinearity');
  const [featureGroupId, setFeatureGroupId] = useState(null);
  const [targetValue, setTargetValue] = useState(null);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }

  const projectOne = useProject(projectId);

  useEffect(() => {
    let isCancelled = false;

    if (projectOne?.useCase) {
      REClient_.client_()._getEdaForecastingTargetMappings(projectOne?.useCase, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          if (!isCancelled) {
            setTargetValue(res?.result);
          }
        }
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [projectOne?.useCase]);

  const handleSubmit = (values) => {
    setIsProcessing(true);

    const featureMappings = {};
    if (values.targetVariable?.value && targetValue) {
      featureMappings[values.targetVariable?.value] = targetValue;
    }
    if (values.timestampColumn?.value) {
      featureMappings[values.timestampColumn?.value] = 'DATE';
    }

    REClient_.client_().createEda(
      projectId,
      values.featureGroup?.value,
      values.name,
      /*values.refreshSchedule*/ null,
      type === 'collinearity',
      type === 'data_consistency',
      values.collinearityKeys,
      values.primaryKey,
      values.testVersion?.value,
      values.referenceVersion?.value,
      featureMappings,
      values.forecastFrequency?.value,
      (err, res) => {
        setIsProcessing(false);

        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          StoreActions.listEda_(projectId);

          Location.push('/' + PartsLink.exploratory_data_analysis + '/' + projectId);
        }
      },
    );
  };

  useEffect(() => {
    featureGroups.memFeatureGroupsForProjectId(true, projectId);
  }, [featureGroupsParam, projectId]);

  const featureGroupsList = useMemo(() => {
    return featureGroups.memFeatureGroupsForProjectId(false, projectId);
  }, [featureGroupsParam, projectId]);

  const featureGroupOne = useFeatureGroup(projectId, featureGroupId);

  useEffect(() => {
    featureGroups.memFeatureGroupsVersionsForFeatureGroupId(true, featureGroupId);
  }, [featureGroupsParam, featureGroupId]);

  const featureGroupVersionsList = useMemo(() => {
    return featureGroups.memFeatureGroupsVersionsForFeatureGroupId(false, featureGroupId);
  }, [featureGroupsParam, featureGroupId]);

  const optionsFGall = useMemo(() => {
    let res = featureGroupsList?.map((f1) => ({ label: f1.tableName, value: f1.featureGroupId, data: f1 }));
    if (res != null) {
      res = _.sortBy(res, 'label');
    }
    return res;
  }, [featureGroupsList]);

  const optionsFieldsLastTarget = React.useRef(null);
  const optionsTarget = useMemo(() => {
    let res = featureGroupOne?.projectFeatureGroupSchema?.schema?.map((s1, s1ind) => ({ label: s1.name, value: s1.name, data: s1 }));
    if (res != null) {
      res = _.sortBy(res, ['value']);
      res.unshift({ label: '(None)', value: null });
    }

    if (optionsFieldsLastTarget.current == null || !_.isEqual(optionsFieldsLastTarget.current, res)) {
      optionsFieldsLastTarget.current = res;
    } else {
      res = optionsFieldsLastTarget.current;
    }

    return res;
  }, [featureGroupOne]);

  const optionsFieldsLastTimestamp = React.useRef(null);
  const optionsTimestampColumn = useMemo(() => {
    let res = featureGroupOne?.projectFeatureGroupSchema?.schema?.map((s1, s1ind) => ({ label: s1.name, value: s1.name, data: s1 }));
    if (res != null) {
      res = _.sortBy(res, ['value']);
      res.unshift({ label: '(None)', value: null });
    }

    if (optionsFieldsLastTimestamp.current == null || !_.isEqual(optionsFieldsLastTimestamp.current, res)) {
      optionsFieldsLastTimestamp.current = res;
    } else {
      res = optionsFieldsLastTimestamp.current;
    }

    return res;
  }, [featureGroupOne]);

  const optionsForecastFrequency = useMemo(() => {
    let res = FORECAST_FREQUENCIES?.map((item) => ({ label: item, value: item }));
    return res;
  }, [FORECAST_FREQUENCIES]);

  const optionsTestVersion = useMemo(() => {
    let res = featureGroupVersionsList?.map((f1) => ({
      label: (
        <span>
          <span className={'textVersion'}>{f1?.featureGroupVersion}&nbsp;-&nbsp;</span>
          <DateOld always date={f1?.createdAt} />
        </span>
      ),
      value: { selection_strategy: SPECIFIC_VERSION, specific_feature_group_version: f1.featureGroupVersion },
      data: f1,
    }));
    res ??= [];
    res.unshift({ label: '(Latest Version)', value: { selection_strategy: LATEST_VERSION } });

    return res;
  }, [featureGroupVersionsList]);

  const optionsReferenceVersion = useMemo(() => {
    let res = featureGroupVersionsList?.map((f1) => ({
      label: (
        <span>
          <span className={'textVersion'}>{f1?.featureGroupVersion}&nbsp;-&nbsp;</span>
          <DateOld always date={f1?.createdAt} />
        </span>
      ),
      value: { selection_strategy: SPECIFIC_VERSION, specific_feature_group_version: f1.featureGroupVersion },
      data: f1,
    }));
    res ??= [];
    res.unshift({ label: '(Version before the Latest)', value: { selection_strategy: N_VERSION } });
    return res;
  }, [featureGroupVersionsList]);

  const optionsFields = useMemo(() => {
    let res = calcSchemaForFeature(featureGroupOne)?.map((f1) => {
      return {
        label: f1.name,
        value: f1.name,
        data: f1,
      };
    });

    if (res) {
      res.unshift({ label: '(None)', value: null });
    }

    return res;
  }, [featureGroupOne]);

  useEffect(() => {
    if (featureGroupOne != null) {
      let vv: any;
      featureGroupOne?.projectFeatureGroupSchema?.schema?.some((f1) => {
        let map1 = f1?.featureMapping?.toUpperCase();
        if (ForcedKeys.includes(map1)) {
          if (vv?.['primaryKey'] == null) {
            vv = vv ?? {};

            let v1 = optionsTestVersion?.find((o1) => o1.value === f1.name);
            vv['primaryKey'] = v1;
          }

          if (vv?.['collinearityKeys'] == null) {
            vv = vv ?? {};

            let v1 = optionsTestVersion?.find((o1) => o1.value === f1.name);
            vv['collinearityKeys'] = v1;
          }
        }
      });

      if (vv != null) {
        form?.setFieldsValue(vv);
      }
    }
  }, [featureGroupOne, optionsTestVersion]);

  const onChangeType = (e) => {
    setType(e.target.value);
  };

  const onChangeFeatureGroup = (option) => {
    setFeatureGroupId(option?.value);
  };

  // const onChangeCronValue = v1 => {
  //   form?.setFieldsValue({ refreshSchedule: v1 });
  // };

  return (
    <div style={{ margin: '30px auto', maxWidth: '80%', width: '1200px', color: Utils.colorA(1) }}>
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
                Create New EDA
              </div>

              <Form.Item
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Select the type of EDA <HelpIcon id={'eda_options_icons'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <Radio.Group value={type} onChange={onChangeType}>
                  <Radio value={'collinearity'}>
                    <span
                      css={`
                        color: white;
                      `}
                    >
                      Collinearity
                    </span>
                  </Radio>
                  <Radio value={'data_consistency'}>
                    <span
                      css={`
                        color: white;
                      `}
                    >
                      Data Consistency
                    </span>
                  </Radio>
                  {targetValue && (
                    <Radio value={'forecasting'}>
                      <span
                        css={`
                          color: white;
                        `}
                      >
                        Forecasting
                      </span>
                    </Radio>
                  )}
                </Radio.Group>
              </Form.Item>

              <Form.Item rules={[{ required: true, message: 'Required!' }]} name={'name'} label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>EDA Name</span>}>
                <Input autoComplete={'off'} placeholder={''} />
              </Form.Item>

              <Form.Item
                name={'featureGroup'}
                rules={[{ required: true, message: 'Required!' }]}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Feature Group <HelpIcon id={'eda_feature_group'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <SelectExt options={optionsFGall} onChange={onChangeFeatureGroup} />
              </Form.Item>

              {type === 'data_consistency' && (
                <Form.Item
                  name={'testVersion'}
                  rules={[{ required: true, message: 'Required!' }]}
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      Test Version <HelpIcon id={'eda_test_version'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <SelectExt options={optionsTestVersion} />
                </Form.Item>
              )}

              {type === 'data_consistency' && (
                <Form.Item
                  name={'referenceVersion'}
                  rules={[{ required: true, message: 'Required!' }]}
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      Reference Version <HelpIcon id={'eda_reference_version'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <SelectExt options={optionsReferenceVersion} />
                </Form.Item>
              )}

              {(type === 'data_consistency' || type === 'forecasting') && (
                <Form.Item
                  rules={[{ required: true, message: 'Required!' }]}
                  name={'primaryKey'}
                  label={
                    <span style={{ color: Utils.colorA(1) }}>
                      Primary Key <HelpIcon id={'eda_primary_keys'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <TagsSelectExt addName={'Add'} options={optionsFields ?? Utils.emptyStaticArray()} />
                </Form.Item>
              )}

              {type === 'collinearity' && (
                <Form.Item
                  name={'collinearityKeys'}
                  label={
                    <span style={{ color: Utils.colorA(1) }}>
                      Specific Collinearity Keys <HelpIcon id={'eda_collinearity_keys'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <TagsSelectExt addName={'Add'} options={optionsFields ?? Utils.emptyStaticArray()} />
                </Form.Item>
              )}

              {type === 'forecasting' && (
                <Form.Item
                  name={'targetVariable'}
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      Target Variable (Demand or variable to forecast) <HelpIcon id={'eda_target_variable'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <SelectExt options={optionsTarget} />
                </Form.Item>
              )}

              {type === 'forecasting' && (
                <Form.Item
                  name={'timestampColumn'}
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      Timestamp Column <HelpIcon id={'eda_timestamp_column'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <SelectExt options={optionsTimestampColumn} />
                </Form.Item>
              )}

              {type === 'forecasting' && (
                <Form.Item
                  name={'forecastFrequency'}
                  rules={[{ required: true, message: 'Required!' }]}
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      Forecast Frequency <HelpIcon id={'eda_forecast_frequency'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <SelectExt options={optionsForecastFrequency} />
                </Form.Item>
              )}

              {/* <InputCron onChange={onChangeCronValue} style={{ marginTop: '10px', }} /> */}
            </div>

            <div style={{ textAlign: 'center' }}>
              <Button type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: '16px' }}>
                Create
              </Button>
            </div>
          </FormExt>
        </Spin>
      </Card>
    </div>
  );
});

export default EDACreateNew;
