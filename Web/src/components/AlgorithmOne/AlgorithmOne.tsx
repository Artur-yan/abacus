import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Spin from 'antd/lib/spin';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useAlgorithm, useCustomModelInfo, useListAvailableProblemTypesForAlgorithms, useNotebook, useProblemTypes, useProject, useUseCaseFromProjectOne } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import EditorElem from '../EditorElem/EditorElem';
import EditorElemForFeatureGroup from '../EditorElemForFeatureGroup/EditorElemForFeatureGroup';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./AlgorithmOne.module.css');
const sd = require('../antdUseDark.module.css');

const USERPrefix = 'USER.';

interface IAlgorithmOneProps {}

const AlgorithmOne = React.memo((props: PropsWithChildren<IAlgorithmOneProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [form] = Form.useForm();
  const refEditorSql = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [editNotebookId, setEditNotebookId] = useState(null);

  let projectId = paramsProp?.get('projectId');
  if (projectId === '' || projectId === '-') {
    projectId = null;
  }

  let algoName = paramsProp?.get('algorithmId');
  if (algoName === '' || algoName === '-') {
    algoName = null;
  }

  let isEdit = paramsProp?.get('isEdit') === '1';

  const listAlgoForProblemTypes = useListAvailableProblemTypesForAlgorithms();

  const projectOne = useProject(projectId);
  const algoOne = useAlgorithm(algoName);
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

    if (isEdit && algoOne != null) {
      alreadyInitEdit.current = true;

      let vv: any = {
        name: algoOne?.name,
        displayName: algoOne?.displayName,
        problemType: Utils.isNullOrEmpty(algoOne?.problemType) ? null : { label: algoOne?.problemType, value: algoOne?.problemType },
        sourceCode: algoOne?.codeSource?.sourceCode,
        trainFunctionName: algoOne?.trainFunctionName,
        predictFunctionName: algoOne?.predictFunctionName,
        predictManyFunctionName: algoOne?.predictManyFunctionName,
        initializeFunctionName: algoOne?.initializeFunctionName,
        trainingInputMappings: algoOne?.trainingInputMappings == null ? '' : JSON.stringify(algoOne?.trainingInputMappings, null, 2),
        // configOptions: null,
        isDefaultEnabled: algoOne?.isDefaultEnabled === true,
        // projectId
      };

      setEditNotebookId(algoOne?.notebookId);

      form?.setFieldsValue(vv);
    }
  }, [isEdit, algoOne, form]);

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
        // predictFunctionName: modelInfo?.predictFuncName,
        predictManyFunctionName: values?.predictManyFunctionName,
        // initializeFunctionName: modelInfo?.initializeFunctionName,
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
        // name: algoOne?.name,
        // displayName: algoOne?.displayName,
        // problemType: Utils.isNullOrEmpty(algoOne?.problemType) ? null : ({ label: algoOne?.problemType, value: algoOne?.problemType, }),
        sourceCode: sourceCode,
        trainFunctionName: modelInfo?.trainFuncName,
        // predictFunctionName: modelInfo?.predictFuncName,
        predictManyFunctionName: modelInfo?.predictManyFuncName,
        // initializeFunctionName: modelInfo?.initializeFunctionName,
        trainingInputMappings: map1,
        // configOptions: null,
        // isDefaultEnabled: algoOne?.isDefaultEnabled===true,
        // projectId
      };

      alreadyInitNoEditModelInfoLast.current = vv;

      form?.setFieldsValue(vv);

      forceUpdate();
    }
  }, [isEdit, modelInfo, form]);

  const sample1 = null;

  const onFormChange = (e) => {
    //
  };

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
      // REClient_.client_().createAlgorithm(USERPrefix+values.name, values.displayName, values.problemType?.value, values.sourceCode, trainingInputMappings, values.trainFunctionName, values.predictFunctionName, values.predictManyFunctionName, values.initializeFunctionName, null, values.isDefaultEnabled, projectId, (err, res) => {
      REClient_.client_().createAlgorithm(USERPrefix + values.name, values.problemType?.value, null, null, null, null, null, null, null, null, null, projectId, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          let name1 = USERPrefix + values.name;

          if (projectId) {
            StoreActions.listAlgosByProblemTypeId_(null, projectId);
            StoreActions.listAlgosByProblemTypeId_(values.problemType?.value, projectId);
          }
          StoreActions.listAlgosByProblemTypeId_(values.problemType?.value);
          StoreActions.listAlgosByProblemTypeId_();

          StoreActions.describeAlgo_(name1, (resAlgo) => {
            if (res?.result?.notebookId == null) {
              REActions.addNotification('Done!');
              Location.push('/' + PartsLink.algorithm_list + '/' + (projectId ?? '-'));
            } else {
              REActions.addNotification('Next step: Specify your algorithm by using this template notebook');
              Location.push('/' + PartsLink.algorithm_one + '/' + (projectId ?? '-') + '/' + encodeURIComponent(name1), undefined, 'notebookId=' + encodeURIComponent(res?.result?.notebookId));
            }
          });
        }
      });
    } else {
      Location.push('/' + PartsLink.algorithm_list + '/' + (projectId ?? '-'));
      // REClient_.client_().updateAlgorithm(values.name, values.displayName, values.sourceCode, trainingInputMappings, values.trainFunctionName, values.predictFunctionName, values.predictManyFunctionName, values.initializeFunctionName, null, values.isDefaultEnabled, (err, res) => {
      //   if(err || !res?.success) {
      //     REActions.addNotificationError(err || Constants.errorDefault);
      //
      //   } else {
      //     REActions.addNotification('Done!');
      //
      //     let name1 = values.name;
      //
      //     if(projectId) {
      //       StoreActions.listAlgosByProblemTypeId_(null, projectId);
      //       StoreActions.listAlgosByProblemTypeId_(values.problemType?.value, projectId);
      //     }
      //     StoreActions.listAlgosByProblemTypeId_(values.problemType?.value);
      //     StoreActions.listAlgosByProblemTypeId_();
      //
      //     StoreActions.describeAlgo_(name1);
      //     Location.push('/'+PartsLink.algorithm_list+'/'+(projectId ?? '-'));
      //   }
      // });
    }
  };

  const onChangeFormSql = (value: string) => {
    //
  };

  const onKeyPressName = (e) => {};

  const isAiAgent = useMemo(() => projectOne?.useCase === 'AI_AGENT', [projectOne]);

  return (
    <div style={{ margin: '0 30px' }}>
      <div style={{ margin: '30px auto', maxWidth: '1000px', color: Utils.colorA(1) }}>
        {
          <div>
            <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
              <span>
                {isAiAgent ? 'Agent' : 'Algorithm'}
                <HelpIcon id={'algo_edit_one'} style={{ marginLeft: '4px' }} />
              </span>
            </div>
          </div>
        }
        <Card style={{ boxShadow: '0 0 4px rgba(0,0,0,0.2)', border: '1px solid ' + Utils.colorA(0.5), backgroundColor: Utils.colorA(0.04), borderRadius: '5px' }} className={sd.grayPanel}>
          {/*// @ts-ignore*/}
          <Spin spinning={isProcessing} size={'large'}>
            {
              <FormExt layout={'vertical'} form={form} onChange={onFormChange} onFinish={handleSubmit} initialValues={{}}>
                {
                  <Form.Item
                    normalize={(value, prevValue, allValues) => {
                      return value?.toUpperCase()?.replace(/[^0-9A-Za-z_]/gi, '');
                    }}
                    name={'name'}
                    rules={[{ required: true, message: 'Required!' }]}
                    style={{ marginBottom: '10px' }}
                    hasFeedback
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        Name:
                        <HelpIcon id={'algoone_name'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <Input
                      prefix={!isEdit ? <span>{USERPrefix}</span> : null}
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

                {
                  <Form.Item
                    name={'problemType'}
                    rules={[{ required: true, message: 'Required!' }]}
                    style={{ marginBottom: '10px' }}
                    hasFeedback
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        Problem Type:
                        <HelpIcon id={'algoone_problemType'} style={{ marginLeft: '4px' }} />
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
                  </Form.Item>
                }

                {/*{isEdit && <Form.Item name={'displayName'} style={{ marginBottom: '10px', }} hasFeedback label={<span style={{ color: Utils.isDark() ? 'white' : 'black', }}>Display Name:</span>}>*/}
                {/*  <Input placeholder="" autoComplete={'off'} />*/}
                {/*</Form.Item>}*/}

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
                        <HelpIcon id={'algoone_notebook'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <Link to={['/' + PartsLink.algorithm_one + '/-/' + encodeURIComponent(algoName), 'fromEdit=1&notebookId=' + encodeURIComponent(editNotebookId)]} showAsLinkBlue usePointer>
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

                {/*{isEdit && <Form.Item name={'trainFunctionName'} style={{ marginBottom: '10px', }} hasFeedback label={<span style={{ color: Utils.isDark() ? 'white' : 'black', }}>Train Function Name:</span>}>*/}
                {/*  <Input placeholder="" autoComplete={'off'} />*/}
                {/*</Form.Item>}*/}

                {/*{isEdit && <Form.Item name={'predictFunctionName'} style={{ marginBottom: '10px', }} hasFeedback label={<span style={{ color: Utils.isDark() ? 'white' : 'black', }}>Predict Function Name:</span>}>*/}
                {/*  <Input placeholder="" autoComplete={'off'} />*/}
                {/*</Form.Item>}*/}

                {/*{isEdit && <Form.Item name={'predictManyFunctionName'} style={{ marginBottom: '10px', }} hasFeedback label={<span style={{ color: Utils.isDark() ? 'white' : 'black', }}>Predict Many Function Name:</span>}>*/}
                {/*  <Input placeholder="" autoComplete={'off'} />*/}
                {/*</Form.Item>}*/}

                {/*{isEdit && <Form.Item name={'initializeFunctionName'} style={{ marginBottom: '10px', }} hasFeedback label={<span style={{ color: Utils.isDark() ? 'white' : 'black', }}>Initialize Function Name:</span>}>*/}
                {/*  <Input placeholder="" autoComplete={'off'} />*/}
                {/*</Form.Item>}*/}

                {isEdit && (
                  <Form.Item
                    name={'trainingInputMappings'}
                    label={
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        {'Training Input Mappings'}:<HelpIcon id={'algoone_trainInputMappings'} style={{ marginLeft: '4px' }} />
                      </span>
                    }
                  >
                    <EditorElem seeMore readonly height={200} useInternal />
                  </Form.Item>
                )}

                {/*{isEdit && <Form.Item valuePropName={'checked'} name={'isDefaultEnabled'} style={{ marginBottom: '10px', }} hasFeedback label={<span style={{ color: Utils.isDark() ? 'white' : 'black', }}>Is Default Enabled:</span>}>*/}
                {/*  <Checkbox />*/}
                {/*</Form.Item>}*/}

                {isEdit && (
                  <div
                    css={`
                      position: relative;
                    `}
                  >
                    <Form.Item
                      name={'sourceCode'}
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          {'Python Code'}:<HelpIcon id={'algoone_code'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <EditorElemForFeatureGroup seeMore readonly allowResizeHeight={'hh_edit_code_algo_one'} onlyThisFeatureGroup height={400 - 30 - 90} lang={'python'} onChange={onChangeFormSql} refEditor={refEditorSql} />
                    </Form.Item>

                    {!Utils.isNullOrEmpty(sample1) && (
                      <div
                        css={`
                          border-bottom-left-radius: 4px;
                          border-bottom-right-radius: 4px;
                          margin-top: 0;
                          padding: 6px 10px;
                          border: 1px solid rgba(255, 255, 255, 0.1);
                          background-color: #303030;
                        `}
                      >
                        {!isEdit && (
                          <div
                            css={`
                              font-size: 14px;
                              color: #337dee;
                              text-align: center;
                            `}
                          >
                            Sample
                          </div>
                        )}
                        {!isEdit && false && (
                          <div
                            css={`
                              color: rgba(255, 255, 255, 0.7);
                              font-size: 13px;
                              text-align: center;
                            `}
                          >
                            {sample1}
                          </div>
                        )}
                        <div
                          css={`
                            color: rgba(255, 255, 255, 0.4);
                            margin-top: ${!isEdit ? 5 : 0}px;
                            font-size: 13px;
                            text-align: center;
                          `}
                        >
                          (Press Ctrl+Space to autocomplete name of columns and datasets)
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>
                <div style={{ textAlign: 'center' }}>
                  <Button disabled={false} type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: '16px' }}>
                    {isEdit ? 'Close' : isAiAgent ? 'Add New Agent' : 'Add New Algorithm'}
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

export default AlgorithmOne;
