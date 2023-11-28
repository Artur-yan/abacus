import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Col from 'antd/lib/col';
import Collapse from 'antd/lib/collapse';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Row from 'antd/lib/row';
import Spin from 'antd/lib/spin';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useFeatureGroup, useModelList, useProject, useProjectsAll } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import featureGroups from '../../stores/reducers/featureGroups';
import FormExt from '../FormExt/FormExt';
import HelpBox from '../HelpBox/HelpBox';
import InputCron from '../InputCron/InputCron';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TagsSelectExt from '../TagsSelectExt/TagsSelectExt';
const s = require('./ModelCreateMonitoring.module.css');
const sd = require('../antdUseDark.module.css');
const { Panel } = Collapse;

interface IModelCreateMonitoringProps {}

const PROTECTED_CLASS = 'PROTECTED_CLASS';
const ForcedKeys = ['ACTUAL', 'PREDICTED_VALUE', 'PREDICTED_PROBABILITY', PROTECTED_CLASS];
const ForcedKeysTrain = ['TARGET', 'PREDICTED_VALUE'];

const ModelCreateMonitoring = React.memo((props: PropsWithChildren<IModelCreateMonitoringProps>) => {
  const { monitoringParam, paramsProp, featureGroupsParam, projectsParam, useCasesParam, modelsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    featureGroupsParam: state.featureGroups,
    useCasesParam: state.useCases,
    projectsParam: state.projects,
    modelsParam: state.models,
    monitoringParam: state.monitoring,
  }));

  const [form] = Form.useForm();
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isProcessing, setIsProcessing] = useState(false);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }

  let editModelId = paramsProp?.get('editModelId');
  if (editModelId === '') {
    editModelId = null;
  }

  const foundProject1 = useProject(projectId);

  const handleSubmit = (values) => {
    let featureMappings = null,
      trainingFeatureMappings = null;

    const calcMappings = (list, mappings, prefix = 'bias_') => {
      list?.some((r1, r1ind) => {
        let v1 = values?.[prefix + r1.featureMapping];
        if (v1 != null) {
          mappings ??= {};

          if (r1.isMultiple) {
            if (_.isArray(v1)) {
              v1.some((v2) => {
                if (v2 != null) {
                  mappings[v2] = r1.featureMapping;
                }
              });
            }
          } else {
            if (_.isString(v1) || _.isNumber(v1)) {
              if (v1 != null) {
                mappings['' + v1] = r1.featureMapping;
              }
            } else {
              if (v1?.value != null) {
                mappings['' + v1?.value] = r1.featureMapping;
              }
            }
          }
        }
      });

      return mappings;
    };

    featureMappings = calcMappings(mappingsPred, featureMappings, 'bias_');
    trainingFeatureMappings = calcMappings(mappingsPred, trainingFeatureMappings, 'train_');

    let targetValue = values.biasFavorableOutcome?.value;

    REClient_.client_().createModelMonitor(
      projectId,
      values.modelId?.value,
      values.name,
      values.trainFG?.value,
      values.predFG?.value,
      values.cron,
      featureMappings,
      targetValue,
      null,
      null,
      trainingFeatureMappings,
      null,
      null,
      (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          StoreActions.listMonitoringModels_(projectId);

          Location.push('/' + PartsLink.monitors_list + '/' + projectId);
        }
      },
    );
  };

  if (foundProject1 != null && foundProject1?.isDrift !== true && !['PREDICTING'].includes(foundProject1?.useCase?.toUpperCase())) {
    return <RefreshAndProgress msgMsg={'Project is not Custom Drift'}></RefreshAndProgress>;
  }

  const onChangeCronValue = (v1) => {
    form?.setFieldsValue({ cron: v1 });
  };

  useEffect(() => {
    featureGroups.memFeatureGroupsForProjectId(true, projectId);
  }, [featureGroupsParam, projectId]);
  const featureGroupsList = useMemo(() => {
    return featureGroups.memFeatureGroupsForProjectId(false, projectId);
  }, [featureGroupsParam, projectId]);
  const optionsFGtrain = useMemo(() => {
    //filter(f1 => f1.featureGroupType?.toUpperCase()==='TRAINING_DATA')
    let res = featureGroupsList?.map((f1) => ({ label: f1.tableName, value: f1.featureGroupId, data: f1 }));
    if (res != null) {
      res = _.sortBy(res, 'label');
    }
    return res;
  }, [featureGroupsList]);
  const optionsFGpred = useMemo(() => {
    //filter(f1 => f1.featureGroupType?.toUpperCase()==='PREDICTION_LOG')
    let res = featureGroupsList?.map((f1) => ({ label: f1.tableName, value: f1.featureGroupId, data: f1 }));
    if (res != null) {
      res = _.sortBy(res, 'label');
    }
    return res;
  }, [featureGroupsList]);

  const projectsList = useProjectsAll();
  const optionsProjects = useMemo(() => {
    let res = projectsList?.map((p1) => ({ label: p1.name, value: p1.projectId })) ?? [];
    if (res != null) {
      res = _.sortBy(res, 'label');
    }
    return res;
  }, [projectsList]);

  const optionsProjectsSelId = form?.getFieldValue('modelIdprojectId')?.value;
  const optionsProjectFound = useProject(optionsProjectsSelId);
  const optionsProjectFoundModelsList = useModelList(optionsProjectsSelId);

  const optionsModelIds = useMemo(() => {
    let res = optionsProjectFoundModelsList?.toJS()?.map((m1) => ({ label: m1.name, value: m1.modelId, data: m1 }));
    if (res != null) {
      res = _.sortBy(res, 'label');
    }
    return res;
  }, [optionsProjectFoundModelsList]);

  const onChangeForm = (v1) => {
    setTimeout(() => {
      // let values = form.getFieldsValue();
      forceUpdate();
    }, 0);
  };

  const predFeatureGroupId = form.getFieldValue('predFG')?.value;
  const predFGOne = useFeatureGroup(projectId, predFeatureGroupId);

  const trainFeatureGroupId = form.getFieldValue('trainFG')?.value;
  const trainFGOne = useFeatureGroup(projectId, trainFeatureGroupId);

  const projectUseCase = useMemo(() => {
    return foundProject1?.useCase;
  }, [foundProject1]);

  const [mappingsPred, setMappingsPred] = useState(null as { isMultiple?: boolean; isRequired?: boolean; field?: string; name?: string; featureMapping?: string }[]);
  const [mappingsTrain, setMappingsTrain] = useState(null as { isMultiple?: boolean; isRequired?: boolean; field?: string; name?: string; featureMapping?: string }[]);

  useEffect(() => {
    if (!projectUseCase) {
      setMappingsPred(null);
      setMappingsTrain(null);
      return;
    }

    REClient_.client_().describeUseCaseRequirements(projectUseCase, (err, res) => {
      let p1 = res?.result?.find((r1) => r1.datasetType?.toUpperCase() === 'PREDICTION_LOG');
      if (p1 != null) {
        p1 = p1?.allowedFeatureMappings;
        if (p1 != null) {
          let kk = ForcedKeys;
          let res = kk.map((k1) => ({ isMultiple: k1 === PROTECTED_CLASS, isRequired: p1[k1]?.isRequired === true && !['PREDICTED_PROBABILITY'].includes(k1), featureMapping: k1, name: p1[k1]?.description + ' (' + k1 + ')' }));
          // res.splice(2,0, ({ isMultiple: false, isRequired: true, featureMapping: 'PREDICTED_PROBABILITY', name: 'Model prediction probability for this prediction data. (PREDICTED_PROBABILITY)', }));
          setMappingsPred(res);

          res = [];
          res.push({ isMultiple: false, isRequired: false, featureMapping: 'TARGET', name: 'The Target Value of this Training Data (TARGET)' });
          res.push({ isMultiple: false, isRequired: false, featureMapping: 'PREDICTED_VALUE', name: 'The Predicted Value In This Feature Group (PREDICTED_VALUE)' });
          setMappingsTrain(res);
          return;
        }
      }
      setMappingsPred(null);
      setMappingsTrain(null);
    });
  }, [projectUseCase]);

  let popupContainerForMenu = useCallback((node) => document.getElementById('body2'), []);

  const optionsFieldsLast = useRef(null);
  const optionsFields = useMemo(() => {
    let res = predFGOne?.projectFeatureGroupSchema?.schema?.map((s1, s1ind) => ({ label: s1.name, value: s1.name, data: s1 }));
    if (res != null) {
      res = _.sortBy(res, ['value']);
      res.unshift({ label: '(None)', value: null });
    }

    if (optionsFieldsLast.current == null || !_.isEqual(optionsFieldsLast.current, res)) {
      optionsFieldsLast.current = res;
    } else {
      res = optionsFieldsLast.current;
    }

    return res;
  }, [predFGOne]);

  const optionsFieldsLastTrain = useRef(null);
  const optionsFieldsTrain = useMemo(() => {
    let res = trainFGOne?.projectFeatureGroupSchema?.schema?.map((s1, s1ind) => ({ label: s1.name, value: s1.name, data: s1 }));
    if (res != null) {
      res = _.sortBy(res, ['value']);
      res.unshift({ label: '(None)', value: null });
    }

    if (optionsFieldsLastTrain.current == null || !_.isEqual(optionsFieldsLastTrain.current, res)) {
      optionsFieldsLastTrain.current = res;
    } else {
      res = optionsFieldsLastTrain.current;
    }

    return res;
  }, [trainFGOne]);

  const predFGid = form?.getFieldValue('predFG')?.value;
  const colActual = form?.getFieldValue('bias_ACTUAL')?.value;

  const [topValuesActual, setTopValuesActual] = useState(null);

  useEffect(() => {
    if (projectId && predFGid && colActual) {
      REClient_.client_()._getFeatureGroupColumnTopValues(projectId, predFGid, colActual, (err, res) => {
        if (err || !res?.success) {
          //
        } else {
          setTopValuesActual(res?.result?.topValues);
          form?.setFieldsValue({ biasFavorableOutcome: null });
        }
      });
    } else {
      setTopValuesActual(null);
    }
  }, [projectId, predFGid, colActual]);

  useEffect(() => {
    if (predFGOne != null) {
      let vv: any;
      predFGOne?.projectFeatureGroupSchema?.schema?.some((f1) => {
        let map1 = f1?.featureMapping?.toUpperCase();
        if (ForcedKeys.includes(map1)) {
          if (vv?.['bias_' + map1] == null || map1 === 'PROTECTED_CLASS') {
            vv = vv ?? {};

            let v1 = optionsFields?.find((o1) => o1.value === f1.name);
            if (map1 === 'PROTECTED_CLASS') {
              v1 = f1.name;

              if (vv['bias_' + map1] == null) {
                v1 = [v1];
              } else {
                v1 = [...(vv['bias_' + map1] ?? []), v1];
              }
            }

            vv['bias_' + map1] = v1;
          }
        }
      });

      if (vv != null) {
        form?.setFieldsValue(vv);
      }
    }
  }, [predFGOne, optionsFields]);

  useEffect(() => {
    if (trainFGOne != null) {
      let vv: any;
      trainFGOne?.projectFeatureGroupSchema?.schema?.some((f1) => {
        let map1 = f1?.featureMapping?.toUpperCase();
        if (ForcedKeysTrain.includes(map1)) {
          if (vv?.['train_' + map1] == null) {
            vv = vv ?? {};

            let v1 = optionsFieldsTrain?.find((o1) => o1.value === f1.name);
            vv['train_' + map1] = v1;
          }
        }
      });

      if (vv != null) {
        form?.setFieldsValue(vv);
      }
    }
  }, [trainFGOne, optionsFieldsTrain]);

  const optionsTopValuesActual = useMemo(() => {
    return topValuesActual?.map((s1) => ({ label: s1, value: s1 }));
  }, [topValuesActual]);

  return (
    <div style={{ margin: '30px auto', maxWidth: '80%', width: '1200px', color: Utils.colorA(1) }}>
      <div
        css={`
          text-align: center;
          max-width: 260px;
          margin: 0 auto 30px auto;
        `}
      >
        <div>{<HelpBox name={'Monitoring'} beforeText={''} linkTo={'/help/modelMonitoring/creating_monitor'} />}</div>
      </div>
      <Card style={{ boxShadow: '0 0 4px rgba(0,0,0,0.2)', border: '1px solid ' + Utils.colorA(0.5), backgroundColor: Utils.colorA(0.04), borderRadius: '5px' }} className={sd.grayPanel}>
        {/*// @ts-ignore*/}
        <Spin spinning={isProcessing} size={'large'}>
          <FormExt layout={'vertical'} form={form} onFinish={handleSubmit} onValuesChange={onChangeForm} initialValues={{}}>
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
                Create {foundProject1?.isDrift ? 'Drift ' : ''}Monitor
              </div>

              <Form.Item name={'name'} label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Monitor Name:</span>}>
                <Input autoComplete={'off'} placeholder={''} />
              </Form.Item>

              <div
                css={`
                  margin: 15px 0;
                  border: 1px solid rgba(255, 255, 255, 0.3);
                  border-radius: 3px;
                  overflow: hidden;
                `}
              >
                <div
                  css={`
                    cursor: pointer;
                    background: rgba(255, 255, 255, 0.2);
                    font-size: 15px;
                    padding: 4px 10px 6px;
                    display: flex;
                    align-items: center;
                  `}
                >
                  <span
                    css={`
                      margin-left: 2px;
                    `}
                  >
                    Reference
                  </span>
                </div>

                <div
                  css={`
                    margin: 15px;
                  `}
                >
                  <Form.Item name={'trainFG'} rules={[{ required: true, message: 'Required!' }]} label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Reference Data Feature Group:</span>}>
                    <SelectExt options={optionsFGtrain} />
                  </Form.Item>

                  {mappingsTrain?.map((r1, r1ind) => {
                    if (r1.isMultiple) {
                      return (
                        <Form.Item
                          key={'train' + r1.featureMapping + '_' + r1ind}
                          rules={r1.isRequired ? [{ required: true, message: 'Required!' }] : undefined}
                          name={'train_' + r1.featureMapping}
                          label={<span style={{ color: Utils.colorA(1) }}>{r1.name}</span>}
                        >
                          <TagsSelectExt addName={'Add'} options={optionsFieldsTrain ?? Utils.emptyStaticArray()} />
                        </Form.Item>
                      );
                    } else {
                      return (
                        <Form.Item
                          key={'train' + r1.featureMapping + '_' + r1ind}
                          rules={r1.isRequired ? [{ required: true, message: 'Required!' }] : undefined}
                          name={'train_' + r1.featureMapping}
                          label={<span style={{ color: Utils.colorA(1) }}>{r1.name}</span>}
                        >
                          <SelectExt options={optionsFieldsTrain ?? Utils.emptyStaticArray()} menuPortalTarget={popupContainerForMenu(null)} />
                        </Form.Item>
                      );
                    }
                  })}
                </div>
              </div>

              <div
                css={`
                  margin: 15px 0;
                  border: 1px solid rgba(255, 255, 255, 0.3);
                  border-radius: 3px;
                  overflow: hidden;
                `}
              >
                <div
                  css={`
                    cursor: pointer;
                    background: rgba(255, 255, 255, 0.2);
                    font-size: 15px;
                    padding: 4px 10px 6px;
                    display: flex;
                    align-items: center;
                  `}
                >
                  <span
                    css={`
                      margin-left: 2px;
                    `}
                  >
                    Test
                  </span>
                </div>

                <div
                  css={`
                    margin: 15px;
                  `}
                >
                  <Form.Item name={'predFG'} rules={[{ required: true, message: 'Required!' }]} label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Test Data Feature Group:</span>}>
                    <SelectExt options={optionsFGpred} />
                  </Form.Item>

                  {mappingsPred?.map((r1, r1ind) => {
                    if (r1.isMultiple) {
                      return (
                        <Form.Item
                          key={'bias' + r1.featureMapping + '_' + r1ind}
                          rules={r1.isRequired ? [{ required: true, message: 'Required!' }] : undefined}
                          name={'bias_' + r1.featureMapping}
                          label={<span style={{ color: Utils.colorA(1) }}>{r1.name}</span>}
                        >
                          <TagsSelectExt addName={'Add'} options={optionsFields ?? Utils.emptyStaticArray()} />
                        </Form.Item>
                      );
                    } else {
                      return (
                        <Form.Item
                          key={'bias' + r1.featureMapping + '_' + r1ind}
                          rules={r1.isRequired || ['ACTUAL'].includes(r1.featureMapping?.toUpperCase()) ? [{ required: true, message: 'Required!' }] : undefined}
                          name={'bias_' + r1.featureMapping}
                          label={<span style={{ color: Utils.colorA(1) }}>{r1.name}</span>}
                        >
                          <SelectExt options={optionsFields ?? Utils.emptyStaticArray()} menuPortalTarget={popupContainerForMenu(null)} />
                        </Form.Item>
                      );
                    }
                  })}

                  <Form.Item name={'biasFavorableOutcome'} label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Favorable Outcome:</span>}>
                    <SelectExt options={optionsTopValuesActual} />
                  </Form.Item>
                </div>
              </div>

              <Row style={{ width: '100%' }}>
                <Col style={{ width: '50%', paddingRight: '5px' }}>
                  <Form.Item name={'modelIdprojectId'} label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Project:</span>}>
                    <SelectExt
                      options={optionsProjects}
                      onChange={(o1) => {
                        forceUpdate();
                        form?.setFieldsValue({ modelId: null });
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col style={{ width: '50%', paddingLeft: '5px' }}>
                  <Form.Item name={'modelId'} label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Model:</span>}>
                    <SelectExt
                      options={optionsModelIds}
                      onChange={(o1) => {
                        forceUpdate();
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <InputCron onChange={onChangeCronValue} style={{ marginTop: '10px' }} />

            <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>
            <div style={{ textAlign: 'center' }}>
              <Button type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: '16px' }}>
                {editModelId ? 'Save' : 'Create'}
              </Button>
            </div>
          </FormExt>
        </Spin>
      </Card>
    </div>
  );
});

export default ModelCreateMonitoring;
