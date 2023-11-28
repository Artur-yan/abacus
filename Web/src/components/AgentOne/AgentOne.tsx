import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Spin from 'antd/lib/spin';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import models from '../../stores/reducers/models';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import PartsLink from '../NavLeft/PartsLink';
import CpuAndMemoryOptions from '../CpuAndMemoryOptions/CpuAndMemoryOptions';
import ResizeHeight from '../ResizeHeight/ResizeHeight';
import EditorElem from '../EditorElem/EditorElem';
const s = require('./AgentOne.module.css');
const sd = require('../antdUseDark.module.css');
const agentSampleCode = `def agent_function(nlp_query):
    """
        Args:
            nlp_query (Any): Data row to predict on/with or to pass to the agent for execution
        Returns:
            The result which can be any json serializable python type
    """
    from abacusai import ApiClient

    # Let agent respond like your favorite character.
    character = 'Sherlock Holmes'
    return ApiClient().evaluate_prompt(prompt=nlp_query, system_message=f'respond like {character}').content
`;

interface IAgentOneProps {}

const AgentOne = React.memo((props: PropsWithChildren<IAgentOneProps>) => {
  const { paramsProp, modelsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    modelsParam: state.models,
  }));

  const [form] = Form.useForm();
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentFuncName, setAgentFuncName] = useState(null);
  const cpuAndMemoryRef = React.useRef(null);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }

  let editModelId = paramsProp?.get('editModelId');
  if (editModelId === '') {
    editModelId = null;
  }

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
        agentFuncName: m1?.predictFunctionName,
        description: m1?.modelConfig?.DESCRIPTION,
        sourceCode: m1?.sourceCode,
        name: m1?.name,
        packageRequirements: m1?.codeSource?.packageRequirements?.join(', '),
      };

      setTimeout(() => {
        cpuAndMemoryRef.current?.setCpuValue(m1?.cpuSize ?? 'MEDIUM');
        cpuAndMemoryRef.current?.setMemoryValue(m1?.memory ?? 16);
      }, 0);

      form?.setFieldsValue(vv);
      setAgentFuncName(m1?.agentFunctionName);
    } else {
      let vv: any = {
        agentFuncName: 'agent_function',
        sourceCode: agentSampleCode,
      };

      form?.setFieldsValue(vv);
    }
  }, [modelOne, editModelId, form]);

  const handleSubmit = (values) => {
    let sourceCode = values.sourceCode ?? '';

    let memoryGB = values.memory;
    if (memoryGB?.value != null) {
      memoryGB = memoryGB?.value;
    }

    const agentFuncName = values.agentFuncName ?? 'agent_function';
    const packageRequirements = values.packageRequirements?.split(',')?.map((item) => item.trim());

    if (editModelId) {
      REClient_.client_().updateAgent(editModelId, sourceCode, agentFuncName, memoryGB, packageRequirements, values.description, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          StoreActions.getModelDetail_(editModelId);
          StoreActions.listModels_(projectId);
          StoreActions.modelsVersionsByModelId_(editModelId);

          Location.push('/' + PartsLink.model_detail + '/' + editModelId + '/' + projectId);
        }
      });
    } else {
      REClient_.client_().createAgent(projectId, sourceCode, agentFuncName, values.name, memoryGB, packageRequirements, values.description, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          StoreActions.listModels_(projectId);

          Location.push('/' + PartsLink.model_list + '/' + projectId);
        }
      });
    }
  };

  const onOpenNotebook = () => {
    REClient_.client_()._createAgentFunctionFileInNotebook(projectId, editModelId, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        const notebookId = res?.result.notebookId;
        if (notebookId) {
          Location.push('/' + PartsLink.python_functions_one + '/' + (projectId ?? '-') + '/' + encodeURIComponent(res?.result?.name ?? '-'), undefined, 'notebookId=' + encodeURIComponent(notebookId), false, true);
        }
      }
    });
  };

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
                {`${modelOne ? 'Edit' : 'Create'} Agent`}
              </div>

              <Form.Item
                name={'name'}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Name:
                    <HelpIcon id={'create_agent_name'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <Input disabled={editModelId != null} autoComplete={'off'} placeholder={''} />
              </Form.Item>
            </div>

            <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>

            <Form.Item
              name={'description'}
              label={
                <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                  Description:
                  <HelpIcon id={'create_agent_description'} style={{ marginLeft: '4px' }} />
                </span>
              }
            >
              <Input autoComplete={'off'} placeholder={''} />
            </Form.Item>

            <Form.Item
              name={'agentFuncName'}
              rules={[{ required: true, message: 'Required!' }]}
              label={
                <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                  Agent Function Name:
                  <HelpIcon id={'create_agent_function_name'} style={{ marginLeft: '4px' }} />
                </span>
              }
            >
              <Input
                autoComplete={'off'}
                placeholder={''}
                onChange={(e) => {
                  setAgentFuncName(e.target.value);
                }}
              />
            </Form.Item>

            <CpuAndMemoryOptions ref={cpuAndMemoryRef} form={form} isForm name={'ModelRegister'} helpidPrefix={'modelreg_python'} memoryLabel={'Training Memory (GB)'} />

            <Form.Item
              name={'packageRequirements'}
              label={
                <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                  Python packages and requirements:
                  <HelpIcon id={'create_agent_package_requirements'} style={{ marginLeft: '4px' }} />
                </span>
              }
            >
              <Input autoComplete={'off'} placeholder={''} />
            </Form.Item>

            <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>

            <ResizeHeight height={430} min={60}>
              {(height) => (
                <div>
                  <Form.Item
                    name={'sourceCode'}
                    rules={[{ required: true, message: 'Required!' }]}
                    labelCol={{ span: 24, offset: 0 }}
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        Python Code:
                        <HelpIcon id={'create_agent_python_code'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <EditorElem lang={'python'} validateOnCall height={height - 65} useInternal hideExpandFGs />
                  </Form.Item>
                  <Button type="primary" style={{ position: 'absolute', top: 0, left: 'calc(100% - 300px)' }} onClick={onOpenNotebook}>
                    Open In Notebook
                  </Button>
                </div>
              )}
            </ResizeHeight>

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

export default AgentOne;
