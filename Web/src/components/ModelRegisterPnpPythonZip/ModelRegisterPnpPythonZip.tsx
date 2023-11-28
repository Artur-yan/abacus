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
import REUploads_ from '../../api/REUploads';
import { useModel, useProject } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import featureGroups from '../../stores/reducers/featureGroups';
import CpuAndMemoryOptions from '../CpuAndMemoryOptions/CpuAndMemoryOptions';
import FormExt from '../FormExt/FormExt';
import FormItemFileUpload from '../FormItemFileUpload/FormItemFileUpload';
import HelpIcon from '../HelpIcon/HelpIcon';
import { EPnpRegisterModelType } from '../ModelRegisterPnpPythonSelect/ModelRegisterPnpPythonSelect';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectReactExt from '../SelectReactExt/SelectReactExt';
const s = require('./ModelRegisterPnpPythonZip.module.css');
const sd = require('../antdUseDark.module.css');
const { Panel } = Collapse;

interface IModelRegisterPnpPythonZipProps {}

const ModelRegisterPnpPythonZip = React.memo((props: PropsWithChildren<IModelRegisterPnpPythonZipProps>) => {
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
  const [isUploading, setIsUploading] = useState(false);
  const [percUpload, setPercUpload] = useState(null);
  const [isUsingMany, setIsUsingMany] = useState(true);
  const cpuAndMemoryRef = useRef(null);

  const [fileEdit, setFileEdit] = useState(null);

  const file1 = StoreActions.ModelRegisterPnpPythonZipFile;

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }

  let editModelId = paramsProp?.get('editModelId');
  if (editModelId === '') {
    editModelId = null;
  }

  useEffect(() => {
    if (!file1 && editModelId == null) {
      Location.push('/' + PartsLink.model_register + '/' + projectId, undefined, 'useSel=' + EPnpRegisterModelType.Zip);
    }
  }, [file1, editModelId]);

  const foundProject1 = useProject(projectId);
  const modelOne = useModel(editModelId);

  let isPnpPython = foundProject1?.isPnpPython === true;

  const handleSubmit = (values) => {
    let code1 = values.sourceCode ?? '';

    let memoryGB = values.memory;
    if (memoryGB?.value != null) {
      memoryGB = memoryGB?.value;
    }

    if (editModelId) {
      REClient_.client_().updatePythonModelZip(
        editModelId,
        values.trainFuncName,
        values.predictManyFuncName,
        values.predictFuncName,
        values.trainModuleName,
        values.predictModuleName,
        values.inputFeatureGroups,
        values.cpuSize?.value,
        memoryGB,
        null,
        (err, res) => {
          if (err || !res?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            let uploadId = res?.result?.uploadId;
            if (!uploadId) {
              setIsUploading(false);
              REActions.addNotificationError(Constants.errorDefault);
            } else {
              REUploads_.client_().doUpload(
                false,
                null,
                uploadId,
                null,
                fileEdit,
                (actual, total) => {
                  setPercUpload((100 / (total === 0 ? 1 : total)) * actual);
                },
                (err1, res1) => {
                  setIsUploading(false);
                  if (err1 || !res1?.success) {
                    REActions.addNotificationError(err || Constants.errorDefault);
                  } else {
                    StoreActions.getModelDetail_(editModelId);
                    StoreActions.listModels_(projectId);
                    StoreActions.modelsVersionsByModelId_(editModelId);

                    Location.push('/' + PartsLink.model_detail + '/' + editModelId + '/' + projectId);
                  }
                },
              );
            }
          }
        },
      );
    } else {
      setIsUploading(true);
      REClient_.client_().createModelFromZip(
        projectId,
        values.trainFuncName,
        values.predictManyFuncName,
        values.predictFuncName,
        values.trainModuleName,
        values.predictModuleName,
        values.inputFeatureGroups,
        values.name,
        values.cpuSize?.value,
        memoryGB,
        null,
        (err, res) => {
          if (err || !res?.success) {
            setIsUploading(false);
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            let uploadId = res?.result?.uploadId;
            if (!uploadId) {
              setIsUploading(false);
              REActions.addNotificationError(Constants.errorDefault);
            } else {
              REUploads_.client_().doUpload(
                false,
                null,
                uploadId,
                null,
                file1,
                (actual, total) => {
                  setPercUpload((100 / (total === 0 ? 1 : total)) * actual);
                },
                (err1, res1) => {
                  setIsUploading(false);
                  if (err1 || !res1?.success) {
                    REActions.addNotificationError(err || Constants.errorDefault);
                  } else {
                    StoreActions.listModels_(projectId);
                    Location.push('/' + PartsLink.model_list + '/' + projectId);
                  }
                },
              );
            }
          }
        },
      );
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

  const onChangeFile = (v1) => {
    setFileEdit(v1);
  };

  useEffect(() => {
    if (editModelId && modelOne) {
      let m1 = modelOne?.toJS();
      let vv: any = {
        trainModuleName: m1?.modelConfig?.TRAIN_MODULE_NAME,
        predictModuleName: m1?.modelConfig?.PREDICT_MODULE_NAME,

        trainFuncName: m1?.trainFunctionName,
        predictFuncName: m1?.predictFunctionName,
        predictManyFuncName: m1?.predictManyFunctionName,

        name: m1?.name,
        inputFeatureGroups: m1?.trainingInputTables ?? [],
      };

      setTimeout(() => {
        cpuAndMemoryRef.current?.setCpuValue(m1?.cpuSize ?? 'MEDIUM');
        cpuAndMemoryRef.current?.setMemoryValue(m1?.memory);
      }, 0);

      setIsUsingMany(!Utils.isNullOrEmpty(vv?.predictManyFuncName));
      form?.setFieldsValue(vv);
    }
  }, [modelOne, editModelId, form]);

  return (
    <div style={{ margin: '30px auto', maxWidth: '80%', width: '1200px', color: Utils.colorA(1) }}>
      <RefreshAndProgress isRefreshing={isUploading} msgMsg={isUploading ? `Uploading... (${Utils.decimals(percUpload, 1)}%)` : undefined} msgTop={0} isRelative isDim={isUploading}>
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
                  Register Model - Zip
                </div>

                <Form.Item
                  name={'name'}
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      Model Name:
                      <HelpIcon id={'modelreg_pythonzip_name'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <Input disabled={editModelId != null} autoComplete={'off'} placeholder={''} />
                </Form.Item>
              </div>

              <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>

              {editModelId != null && <FormItemFileUpload accept={'.zip'} dark formRefInstance={form} name={'files'} onChangeFile={onChangeFile} />}

              <Form.Item
                name={'trainModuleName'}
                rules={[{ required: true, message: 'Required!' }]}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Train Module Name:
                    <HelpIcon id={'modelreg_pythonzip_trainmodulename'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <Input autoComplete={'off'} placeholder={''} />
              </Form.Item>

              <Form.Item
                name={'predictModuleName'}
                rules={[{ required: true, message: 'Required!' }]}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Predict Module Name:
                    <HelpIcon id={'modelreg_pythonzip_predictmodulename'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <Input autoComplete={'off'} placeholder={''} />
              </Form.Item>

              <Form.Item
                name={'trainFuncName'}
                rules={[{ required: true, message: 'Required!' }]}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Train Function Name:
                    <HelpIcon id={'modelreg_pythonzip_trainfuncname'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <Input autoComplete={'off'} placeholder={'train'} />
              </Form.Item>

              {!isUsingMany && (
                <Form.Item
                  name={'predictFuncName'}
                  rules={[{ required: true, message: 'Required!' }]}
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      Predict Function Name:
                      <HelpIcon id={'modelreg_pythonzip_predictfuncname'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <Input autoComplete={'off'} placeholder={'predict'} />
                </Form.Item>
              )}

              {isUsingMany && (
                <Form.Item
                  name={'predictManyFuncName'}
                  rules={[{ required: true, message: 'Required!' }]}
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      Predict Many Function Name:
                      <HelpIcon id={'modelreg_pythonzip_predictmenyfuncname'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <Input autoComplete={'off'} placeholder={'predict_many'} />
                </Form.Item>
              )}

              {
                <Form.Item
                  rules={[{ required: true, message: 'Required!' }]}
                  name={'inputFeatureGroups'}
                  style={{ marginBottom: '10px' }}
                  hasFeedback
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      Training Input Feature Groups:
                      <HelpIcon id={'modelreg_pythonzip_inputfgs'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <SelectReactExt allowReOrder options={optionsFeatureGroupsTables} mode={'multiple'} allowClear />
                </Form.Item>
              }

              <CpuAndMemoryOptions ref={cpuAndMemoryRef} form={form} isForm name={'ModelRegister'} helpidPrefix={'modelreg_pythonzip'} memoryLabel={'Training Memory (GB)'} />

              <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>

              {/*<ResizeHeight height={editorHeight} min={60}>*/}
              {/*  {(height) => (*/}
              {/*    <Form.Item name={'sourceCode'} rules={[{ required: true, message: 'Required!' }]} label={<span style={{ color: Utils.isDark() ? 'white' : 'black', }}>Python Code:</span>}>*/}
              {/*      <EditorElem lang={'python'} validateOnCall height={height-65} useInternal />*/}
              {/*    </Form.Item>*/}
              {/*  )}*/}
              {/*</ResizeHeight>*/}

              <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>
              <div style={{ textAlign: 'center' }}>
                <Button type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: '16px' }}>
                  {editModelId ? 'Save' : 'Register'}
                </Button>
              </div>
            </FormExt>
          </Spin>
        </Card>
      </RefreshAndProgress>
    </div>
  );
});

export default ModelRegisterPnpPythonZip;
