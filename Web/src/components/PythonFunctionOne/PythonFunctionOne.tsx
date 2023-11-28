import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Spin from 'antd/lib/spin';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useAppSelector } from '../../../core/hooks';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useCustomModelInfo, useListAvailableProblemTypesForAlgorithms, useNotebook, useProblemTypes, useProject, usePythonFunctionsOne, useUseCaseFromProjectOne } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
// import SelectExt from '../SelectExt/SelectExt';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import globalStyles from '../antdUseDark.module.css';

interface IPythonFunctionOneProps {}

const PythonFunctionOne = React.memo((props: PropsWithChildren<IPythonFunctionOneProps>) => {
  const paramsProp = useAppSelector((state: any) => state.paramsProp);

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [form] = Form.useForm();

  const [editNotebookId, setEditNotebookId] = useState(null);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '' || projectId === '-') {
    projectId = null;
  }

  let name = paramsProp?.get('name');
  if (name === '' || name === '-') {
    name = null;
  }

  let typeParam = paramsProp?.get('typeParam');
  if (typeParam === '' || typeParam === '-') {
    typeParam = null;
  }

  let isEdit = paramsProp?.get('isEdit') === '1';

  const listAlgoForProblemTypes = useListAvailableProblemTypesForAlgorithms();

  const projectOne = useProject(projectId);
  const pythonFunctionsOne = usePythonFunctionsOne(name);
  const useCaseInfo = useUseCaseFromProjectOne(projectOne, true);
  const problemTypeList = useProblemTypes();

  const notebookOne = useNotebook(editNotebookId);

  const fromProblemType = form?.getFieldValue('problemType')?.value ?? null;

  const modelInfo = useCustomModelInfo(projectId, fromProblemType);

  const optionsProblemType = useMemo(() => {
    return problemTypeList?.map((s1) => ({ label: s1, value: s1 }));
  }, [problemTypeList]);

  const optionsProblemTypeFiltered = useMemo(() => {
    if (listAlgoForProblemTypes == null || listAlgoForProblemTypes?.length === 0) {
      return optionsProblemType;
    } else {
      return optionsProblemType?.filter((o1) => listAlgoForProblemTypes?.includes(o1.value?.toUpperCase()));
    }
  }, [optionsProblemType, listAlgoForProblemTypes]);

  const alreadyInitEdit = useRef(false);
  useEffect(() => {
    alreadyInitEdit.current = false;
  }, [projectId]);
  useEffect(() => {
    if (alreadyInitEdit.current) {
      return;
    }

    if (isEdit && pythonFunctionsOne != null) {
      alreadyInitEdit.current = true;

      let vv: any = {
        name: pythonFunctionsOne?.name,
        problemType: Utils.isNullOrEmpty(pythonFunctionsOne?.problemType) ? null : { label: pythonFunctionsOne?.problemType, value: pythonFunctionsOne?.problemType },
      };

      setEditNotebookId(pythonFunctionsOne?.notebookId);

      form?.setFieldsValue(vv);
    }
  }, [isEdit, pythonFunctionsOne, form]);

  const alreadyInitNoEdit = useRef(false);
  useEffect(() => {
    alreadyInitNoEdit.current = false;
  }, [projectId]);
  useEffect(() => {
    if (alreadyInitNoEdit.current) {
      return;
    }

    if (!isEdit && useCaseInfo != null) {
      alreadyInitNoEdit.current = true;

      let vv: any = {
        problemType: Utils.isNullOrEmpty(useCaseInfo?.ori?.problemType) ? null : { label: useCaseInfo?.ori?.problemType, value: useCaseInfo?.ori?.problemType },
      };
      form?.setFieldsValue(vv);

      forceUpdate();
    }
  }, [isEdit, useCaseInfo, form]);

  const alreadyInitNoEditModelInfoLast = useRef({});
  const alreadyInitNoEditModelInfo = useRef(false);
  useEffect(() => {
    alreadyInitNoEditModelInfo.current = false;
  }, [projectId]);
  useEffect(() => {
    if (alreadyInitNoEditModelInfo.current) {
      return;
    }

    if (!isEdit && modelInfo != null) {
      alreadyInitNoEditModelInfo.current = true;

      let values = form?.getFieldsValue();
      let vvCurrent = {
        sourceCode: values?.sourceCode,
        trainFunctionName: values?.trainFunctionName,
        predictManyFunctionName: values?.predictManyFunctionName,
        trainingInputMappings: values?.trainingInputMappings,
      };

      if (!_.isEmpty(alreadyInitNoEditModelInfoLast.current) && !_.isEqual(alreadyInitNoEditModelInfoLast.current, vvCurrent)) {
        return;
      }

      let sourceCode = '';
      sourceCode += modelInfo?.trainFuncTemplate ?? '';
      sourceCode += modelInfo?.predictManyFuncTemplate ?? '';

      let map1 = '';
      if (!Utils.isNullOrEmpty(modelInfo?.trainingFuncInputMappingsTemplate)) {
        let json1 = Utils.tryJsonParse(modelInfo?.trainingFuncInputMappingsTemplate);
        if (json1 != null) {
          map1 = JSON.stringify(json1, undefined, 2);
        }
      }

      let vv: any = {
        sourceCode: sourceCode,
        trainFunctionName: modelInfo?.trainFuncName,
        predictManyFunctionName: modelInfo?.predictManyFuncName,
        trainingInputMappings: map1,
      };

      alreadyInitNoEditModelInfoLast.current = vv;

      form?.setFieldsValue(vv);

      forceUpdate();
    }
  }, [isEdit, modelInfo, form]);

  const handleSubmit = (values) => {
    let trainingInputMappings = values.trainingInputMappings;
    if (Utils.isNullOrEmpty(trainingInputMappings)) {
      trainingInputMappings = null;
    } else {
      trainingInputMappings = Utils.tryJsonParse(trainingInputMappings);
      if (trainingInputMappings == null) {
        REActions.addNotificationError('Invalid Training Input Mappings JSON');
        return;
      }
    }

    if (!isEdit) {
      REClient_.client_()._getPythonFunctionCodeTemplate(values.name, [], 'PYTHON_FEATURE_GROUP', (err1, res1) => {
        if (err1 || !res1?.success) {
          REActions.addNotificationError(err1 || Constants.errorDefault);
        } else {
          REClient_.client_().createPythonFunction(values.name, res1?.result || '', values.name, null, projectId, null, typeParam, (err, res) => {
            if (err || !res?.success) {
              REActions.addNotificationError(err || Constants.errorDefault);
            } else {
              let name1 = values.name;

              StoreActions.listPythonFunctions_();
              Location.push('/' + PartsLink.python_functions_one + '/' + (projectId ?? '-') + '/' + encodeURIComponent(name1), undefined, 'showEmbeddedNotebook=1&notebookId=' + encodeURIComponent(res?.result?.notebookId));
            }
          });
        }
      });
    } else {
      Location.push('/' + PartsLink.python_functions_list + '/' + (projectId ?? '-'));
    }
  };

  const onKeyPressName = (e) => {};

  return (
    <div style={{ margin: '0 30px' }}>
      <div style={{ margin: '30px auto', maxWidth: '1000px', color: Utils.colorA(1) }}>
        {
          <div>
            <div className={globalStyles.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
              <span>
                {'Python Function'}
                <HelpIcon id={'pythonFunc_edit_one'} style={{ marginLeft: '4px' }} />
              </span>
            </div>
          </div>
        }
        <Card style={{ boxShadow: '0 0 4px rgba(0,0,0,0.2)', border: '1px solid ' + Utils.colorA(0.5), backgroundColor: Utils.colorA(0.04), borderRadius: '5px' }} className={globalStyles.grayPanel}>
          {/*// @ts-ignore*/}
          <Spin spinning={false} size={'large'}>
            {
              <FormExt layout={'vertical'} form={form} onFinish={handleSubmit} initialValues={{}}>
                {
                  <Form.Item
                    name={'name'}
                    rules={[{ required: true, message: 'Required!' }]}
                    style={{ marginBottom: '10px' }}
                    hasFeedback
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        Name:
                        <HelpIcon id={'pythonFunc_name'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <Input
                      css={
                        isEdit
                          ? `&.ant-input-affix-wrapper.ant-input-affix-wrapper {
                  background-color: #424242 !important;
                }`
                          : ''
                      }
                      disabled={isEdit}
                      placeholder=""
                      autoComplete={'off'}
                      onKeyPress={onKeyPressName}
                    />
                  </Form.Item>
                }

                {/* <Form.Item
                    name={'problemType'}
                    rules={[{ required: true, message: 'Required!' }]}
                    style={{ marginBottom: '10px' }}
                    hasFeedback
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        Problem Type:
                        <HelpIcon id={'pythonFunc_problemType'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <SelectExt
                      isDisabled={projectId != null || isEdit}
                      placeholder=""
                      options={optionsProblemTypeFiltered}
                      onChange={(v1) => {
                        alreadyInitNoEditModelInfo.current = false;
                        forceUpdate();
                      }}
                    />
                  </Form.Item> */}

                <div
                  css={`
                    margin-top: 15px;
                    font-size: 1px;
                  `}
                >
                  &nbsp;
                </div>

                {isEdit && editNotebookId != null && (
                  <Form.Item
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        Notebook:
                        <HelpIcon id={'pythonFunc_notebook'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <Link to={['/' + PartsLink.python_functions_one + '/-/' + encodeURIComponent(name), 'fromEdit=1&showEmbeddedNotebook=1&notebookId=' + encodeURIComponent(editNotebookId)]} showAsLinkBlue usePointer>
                      <span>
                        {notebookOne?.name} - {editNotebookId}
                      </span>
                      <span
                        css={`
                          margin-left: 20px;
                        `}
                      >
                        <Button ghost type={'primary'} size={'small'}>
                          Edit
                        </Button>
                      </span>
                    </Link>
                  </Form.Item>
                )}

                <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <Button disabled={false} type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: '16px' }}>
                    {isEdit ? 'Close' : 'Add New Python Function'}
                  </Button>
                </div>
              </FormExt>
            }
          </Spin>
        </Card>
      </div>
    </div>
  );
});

export default PythonFunctionOne;
