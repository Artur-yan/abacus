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
import { useModel, useProject } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import applicationConnectors from '../../stores/reducers/applicationConnectors';
import featureGroups from '../../stores/reducers/featureGroups';
import Connectors from '../Connectors/Connectors';
import CpuAndMemoryOptions from '../CpuAndMemoryOptions/CpuAndMemoryOptions';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import SelectReactExt from '../SelectReactExt/SelectReactExt';
const s = require('./ModelRegisterPnpPythonGit.module.css');
const sd = require('../antdUseDark.module.css');
const { Panel } = Collapse;

interface IModelRegisterPnpPythonGitProps {}

const ModelRegisterPnpPythonGit = React.memo((props: PropsWithChildren<IModelRegisterPnpPythonGitProps>) => {
  const { paramsProp, featureGroupsParam, projectsParam, applicationConnectorsParam, useCasesParam, modelsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    featureGroupsParam: state.featureGroups,
    useCasesParam: state.useCases,
    projectsParam: state.projects,
    modelsParam: state.models,
    applicationConnectorsParam: state.applicationConnectors,
  }));

  const [form] = Form.useForm();
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [percUpload, setPercUpload] = useState(null);
  const [isUsingMany, setIsUsingMany] = useState(true);
  const cpuAndMemoryRef = useRef(null);

  const gitRepoId = paramsProp?.get('gitRepoId');

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }

  let editModelId = paramsProp?.get('editModelId');
  if (editModelId === '') {
    editModelId = null;
  }

  const foundProject1 = useProject(projectId);
  const modelOne = useModel(editModelId);

  let isPnpPython = foundProject1?.isPnpPython === true;

  const handleSubmit = (values) => {
    let code1 = values.sourceCode ?? '';

    let memory = values.memory;
    if (memory?.value != null) {
      memory = memory?.value;
    }

    if (editModelId) {
      REClient_.client_().updatePythonModelGit(
        editModelId,
        values.repo?.value,
        values.branchName,
        values.pythonRoot,
        values.trainFuncName,
        values.predictManyFuncName,
        values.predictFuncName,
        values.trainModuleName,
        values.predictModuleName,
        values.inputFeatureGroups,
        values.cpuSize?.value,
        memory,
        (err, res) => {
          if (err || !res?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            StoreActions.getModelDetail_(editModelId);
            StoreActions.listModels_(projectId);
            StoreActions.modelsVersionsByModelId_(editModelId);

            Location.push('/' + PartsLink.model_detail + '/' + editModelId + '/' + projectId);
          }
        },
      );
    } else {
      REClient_.client_().createModelFromGit(
        projectId,
        gitRepoId,
        values.branchName,
        values.trainFuncName,
        values.predictManyFuncName,
        values.predictFuncName,
        values.trainModuleName,
        values.predictModuleName,
        values.inputFeatureGroups,
        values.pythonRoot,
        values.name,
        values.cpuSize?.value,
        memory,
        null,
        (err, res) => {
          if (err || !res?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
          } else {
            StoreActions.listModels_(projectId);
            Location.push('/' + PartsLink.model_list + '/' + projectId);
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

  useEffect(() => {
    applicationConnectors.memApplicationConnectors(true, applicationConnectorsParam);
  }, [applicationConnectorsParam]);
  const applicationList = useMemo(() => {
    return applicationConnectors.memApplicationConnectors(false, applicationConnectorsParam);
  }, [applicationConnectorsParam]);

  const objectsRepo = useMemo(() => {
    return applicationList?.filter((a1) => a1?.service?.toUpperCase() === 'GIT' && a1?.status?.toUpperCase() === 'ACTIVE')?.map((a1) => ({ label: a1?.name + ' - ' + (a1?.auth?.repoUrl ?? ''), value: a1?.applicationConnectorId }));
  }, [applicationList]);

  const alreadySetEdit = useRef(false);
  useEffect(() => {
    if (alreadySetEdit.current) {
      return;
    }

    if (editModelId && modelOne && objectsRepo) {
      alreadySetEdit.current = true;

      let m1 = modelOne?.toJS();
      let vv: any = {
        branchName: m1?.codeSource?.applicationConnectorInfo?.branchName,
        pythonRoot: m1?.codeSource?.applicationConnectorInfo?.codePath,
        trainModuleName: m1?.modelConfig?.TRAIN_MODULE_NAME,
        predictModuleName: m1?.modelConfig?.PREDICT_MODULE_NAME,

        trainFuncName: m1?.trainFunctionName,
        predictFuncName: m1?.predictFunctionName,
        predictManyFuncName: m1?.predictManyFunctionName,

        name: m1?.name,
        inputFeatureGroups: m1?.trainingInputTables ?? [],

        repo: m1?.codeSource?.applicationConnectorId == null ? null : objectsRepo?.find((o1) => o1.value === m1?.codeSource?.applicationConnectorId),
      };

      setTimeout(() => {
        cpuAndMemoryRef.current?.setCpuValue(m1?.cpuSize ?? 'MEDIUM');
        cpuAndMemoryRef.current?.setMemoryValue(m1?.memory);
      }, 0);

      setIsUsingMany(!Utils.isNullOrEmpty(vv?.predictManyFuncName));
      form?.setFieldsValue(vv);
    }
  }, [modelOne, editModelId, form, objectsRepo]);

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
                  Register Model - Git
                </div>

                <Form.Item
                  name={'name'}
                  label={
                    <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                      Model Name:
                      <HelpIcon id={'modelreg_pythongit_name'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <Input disabled={editModelId != null} autoComplete={'off'} placeholder={''} />
                </Form.Item>
              </div>

              <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>

              {editModelId != null && (
                <span
                  css={`
                    & label {
                      width: 100%;
                    }
                  `}
                >
                  <Form.Item
                    rules={[{ required: true, message: 'Repository Required' }]}
                    name={'repo'}
                    hasFeedback
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black', width: '100%' }}>
                        Repository:
                        <HelpIcon id={'modelreg_pythongit_repo'} style={{ marginLeft: '4px' }} />
                        <span
                          css={`
                            float: right;
                          `}
                        >
                          {/*//@ts-ignore*/}
                          <Connectors style={{ display: 'block' }} isGit>
                            <Button type={'primary'} size={'small'}>
                              Add New Connector
                            </Button>
                          </Connectors>
                        </span>
                      </span>
                    }
                  >
                    <SelectExt options={objectsRepo} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
                  </Form.Item>
                </span>
              )}

              <Form.Item
                name={'branchName'}
                rules={[{ required: true, message: 'Required!' }]}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Branch Name:
                    <HelpIcon id={'modelreg_pythongit_branchname'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <Input autoComplete={'off'} placeholder={''} />
              </Form.Item>

              <Form.Item
                name={'pythonRoot'}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Python Root:
                    <HelpIcon id={'modelreg_pythongit_root'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <Input autoComplete={'off'} placeholder={''} />
              </Form.Item>

              <Form.Item
                name={'trainModuleName'}
                rules={[{ required: true, message: 'Required!' }]}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Train Module Name:
                    <HelpIcon id={'modelreg_pythongit_trainmodulename'} style={{ marginLeft: '4px' }} />
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
                    <HelpIcon id={'modelreg_pythongit_predictmodulename'} style={{ marginLeft: '4px' }} />
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
                    <HelpIcon id={'modelreg_pythongit_trainfuncname'} style={{ marginLeft: '4px' }} />
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
                      <HelpIcon id={'modelreg_pythongit_predictfuncname'} style={{ marginLeft: '4px' }} />
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
                      <HelpIcon id={'modelreg_pythongit_predictmenyfuncname'} style={{ marginLeft: '4px' }} />
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
                      <HelpIcon id={'modelreg_pythongit_inputfgs'} style={{ marginLeft: '4px' }} />
                    </span>
                  }
                >
                  <SelectReactExt allowReOrder options={optionsFeatureGroupsTables} mode={'multiple'} allowClear />
                </Form.Item>
              }

              <CpuAndMemoryOptions ref={cpuAndMemoryRef} form={form} isForm name={'ModelRegister'} helpidPrefix={'modelreg_pythongit'} memoryLabel={'Training Memory (GB)'} />

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

export default ModelRegisterPnpPythonGit;
