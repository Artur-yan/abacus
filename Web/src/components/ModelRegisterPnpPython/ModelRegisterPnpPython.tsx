import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Collapse from 'antd/lib/collapse';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Select from 'antd/lib/select';
import Spin from 'antd/lib/spin';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useCustomModelInfo } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import featureGroups from '../../stores/reducers/featureGroups';
import models from '../../stores/reducers/models';
import { memProjectById } from '../../stores/reducers/projects';
import CpuAndMemoryOptions from '../CpuAndMemoryOptions/CpuAndMemoryOptions';
import EditorElem from '../EditorElem/EditorElem';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import PartsLink from '../NavLeft/PartsLink';
import ResizeHeight from '../ResizeHeight/ResizeHeight';
import SelectReactExt from '../SelectReactExt/SelectReactExt';
const s = require('./ModelRegisterPnpPython.module.css');
const sd = require('../antdUseDark.module.css');
const { Panel } = Collapse;

interface IModelRegisterPnpPythonProps {}

const ModelRegisterPnpPython = React.memo((props: PropsWithChildren<IModelRegisterPnpPythonProps>) => {
  const { paramsProp, featureGroupsParam, projectsParam, useCasesParam, modelsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    featureGroupsParam: state.featureGroups,
    useCasesParam: state.useCases,
    projectsParam: state.projects,
    modelsParam: state.models,
  }));

  const [form] = Form.useForm();
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [predictFuncName, setPredictFuncName] = useState(null);
  const [predictManyFuncName, setPredictManyFuncName] = useState(null);
  const [trainFuncName, setTrainFuncName] = useState(null);
  const [inputFeatureGroups, setInputFeatureGroups] = useState([]);
  const [isUsingMany, setIsUsingMany] = useState(true);
  const cpuAndMemoryRef = useRef(null);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }

  let editModelId = paramsProp?.get('editModelId');
  if (editModelId === '') {
    editModelId = null;
  }

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projectsParam, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projectsParam, projectId]);

  useEffect(() => {
    if (editModelId) {
      models.memModelById(true, undefined, editModelId);
    }
  }, [modelsParam, editModelId]);
  const modelOne = useMemo(() => {
    if (editModelId) {
      return models.memModelById(false, undefined, editModelId);
    }
  }, [modelsParam, editModelId]);

  useEffect(() => {
    if (editModelId && modelOne) {
      let m1 = modelOne?.toJS();
      let vv: any = {
        trainFuncName: m1?.trainFunctionName,
        predictFuncName: m1?.predictFunctionName,
        predictManyFuncName: m1?.predictManyFunctionName,
        sourceCode: m1?.sourceCode,
        name: m1?.name,
        inputFeatureGroups: m1?.trainingInputTables ?? [],
      };

      setTimeout(() => {
        cpuAndMemoryRef.current?.setCpuValue(m1?.cpuSize ?? 'MEDIUM');
        cpuAndMemoryRef.current?.setMemoryValue(m1?.memory);
      }, 0);

      setIsUsingMany(!Utils.isNullOrEmpty(vv?.predictManyFuncName));
      form?.setFieldsValue(vv);
      setPredictFuncName(m1?.predictFunctionName);
      setPredictManyFuncName(m1?.predictManyFunctionName);
      setTrainFuncName(m1?.trainFunctionName);
      setInputFeatureGroups(m1?.trainingInputTables ?? []);
    }
  }, [modelOne, editModelId, form]);

  let isPnpPython = foundProject1?.isPnpPython === true;

  const handleSubmit = (values) => {
    let code1 = values.sourceCode ?? '';

    let inputFeatureGroups = null;
    let ff = values.inputFeatureGroups;
    if (ff != null && ff.length > 0) {
      inputFeatureGroups = JSON.stringify(ff);
    }

    let memoryGB = values.memory;
    if (memoryGB?.value != null) {
      memoryGB = memoryGB?.value;
    }

    if (editModelId) {
      REClient_.client_().updatePythonModel(editModelId, code1, values.trainFuncName, values.predictManyFuncName, values.predictFuncName, inputFeatureGroups, memoryGB, values.cpuSize?.value, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          StoreActions.getModelDetail_(editModelId);
          StoreActions.listModels_(projectId);

          Location.push('/' + PartsLink.model_detail + '/' + editModelId + '/' + projectId);
        }
      });
    } else {
      REClient_.client_().createModelFromPython(projectId, code1, values.trainFuncName, values.predictManyFuncName, values.predictFuncName, inputFeatureGroups, values.name, memoryGB, values.cpuSize?.value, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          StoreActions.listModels_(projectId);

          Location.push('/' + PartsLink.model_list + '/' + projectId);
        }
      });
    }
  };

  const featuresGroupsList = useMemo(() => {
    return featureGroups.memFeatureGroupsForProjectId(false, projectId);
  }, [featureGroupsParam, projectId]);
  useEffect(() => {
    featureGroups.memFeatureGroupsForProjectId(true, projectId);
  }, [featureGroupsParam, projectId]);

  const optionsFeatureGroupsTables = useMemo(() => {
    return featuresGroupsList?.map((f1) => {
      return {
        label: f1.tableName ?? f1.name,
        value: f1.tableName,
        data: f1,
      };
    });
  }, [featuresGroupsList]);

  let popupContainerForMenu = (node) => document.getElementById('body2');

  const editorHeight = 430;

  const resCustomModelInfo = useCustomModelInfo(projectId);

  useEffect(() => {
    if (!form || !resCustomModelInfo || editModelId) {
      return;
    }

    let sourceCode = (resCustomModelInfo?.trainFuncTemplate ?? '') + '\n\n' + (resCustomModelInfo?.predictManyFuncTemplate ?? '');

    let vv = {
      trainFuncName: resCustomModelInfo?.trainFuncName ?? '',
      predictFuncName: resCustomModelInfo?.predictFuncName ?? '',
      predictManyFuncName: resCustomModelInfo?.predictManyFuncName ?? '',
      sourceCode: sourceCode,
    };

    form?.setFieldsValue(vv);
  }, [resCustomModelInfo, form, editModelId]);

  return (
    <div style={{ margin: '30px auto', maxWidth: '80%', width: '1200px', color: Utils.colorA(1) }}>
      <Card style={{ boxShadow: '0 0 4px rgba(0,0,0,0.2)', border: '1px solid ' + Utils.colorA(0.5), backgroundColor: Utils.colorA(0.04), borderRadius: '5px' }} className={sd.grayPanel}>
        {/*// @ts-ignore*/}
        <Spin spinning={isProcessing} size={'large'}>
          <FormExt layout={'vertical'} form={form} onFinish={handleSubmit}>
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
                Register Model
              </div>

              <Form.Item
                name={'name'}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Model Name:
                    <HelpIcon id={'modelreg_python_name'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <Input disabled={editModelId != null} autoComplete={'off'} placeholder={''} />
              </Form.Item>
            </div>

            <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>

            {
              <Form.Item
                rules={[{ required: true, message: 'Required!' }]}
                name={'inputFeatureGroups'}
                style={{ marginBottom: '10px' }}
                hasFeedback
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Training Input Feature Groups:
                    <HelpIcon id={'modelreg_python_inputfgs'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <SelectReactExt
                  allowReOrder
                  options={optionsFeatureGroupsTables}
                  mode={'multiple'}
                  allowClear
                  onChange={(val) => {
                    setInputFeatureGroups(val);
                  }}
                />
              </Form.Item>
            }

            <Form.Item
              name={'trainFuncName'}
              rules={[{ required: true, message: 'Required!' }]}
              label={
                <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                  Train Function Name:
                  <HelpIcon id={'modelreg_python_trainfuncname'} style={{ marginLeft: '4px' }} />
                </span>
              }
            >
              <Input
                autoComplete={'off'}
                placeholder={'train'}
                onChange={(e) => {
                  setTrainFuncName(e.target.value);
                }}
              />
            </Form.Item>

            {!isUsingMany && (
              <Form.Item
                name={'predictFuncName'}
                rules={[{ required: true, message: 'Required!' }]}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Predict Function Name:
                    <HelpIcon id={'modelreg_python_predictfuncname'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <Input
                  autoComplete={'off'}
                  placeholder={'predict'}
                  onChange={(e) => {
                    setPredictFuncName(e.target.value);
                  }}
                />
              </Form.Item>
            )}

            {isUsingMany && (
              <Form.Item
                name={'predictManyFuncName'}
                rules={[{ required: true, message: 'Required!' }]}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Predict Many Function Name:
                    <HelpIcon id={'modelreg_python_predictmanyfuncname'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <Input
                  autoComplete={'off'}
                  placeholder={'predict_many'}
                  onChange={(e) => {
                    setPredictManyFuncName(e.target.value);
                  }}
                />
              </Form.Item>
            )}

            <CpuAndMemoryOptions ref={cpuAndMemoryRef} form={form} isForm name={'ModelRegister'} helpidPrefix={'modelreg_python'} memoryLabel={'Training Memory (GB)'} />

            <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>

            <ResizeHeight height={editorHeight} min={60}>
              {(height) => (
                <Form.Item
                  name={'sourceCode'}
                  rules={[{ required: true, message: 'Required!' }]}
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      Python Code:
                      <HelpIcon id={'modelreg_python_code'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <EditorElem lang={'python'} validateOnCall height={height - 65} useInternal />
                </Form.Item>
              )}
            </ResizeHeight>

            <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>
            <div style={{ textAlign: 'center' }}>
              <Button type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: '16px' }}>
                {editModelId ? 'Save' : 'Register'}
              </Button>
            </div>
          </FormExt>
        </Spin>
      </Card>
    </div>
  );
});

export default ModelRegisterPnpPython;
