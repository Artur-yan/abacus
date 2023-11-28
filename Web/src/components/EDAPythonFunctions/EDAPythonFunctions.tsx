import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Col from 'antd/lib/col';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Radio from 'antd/lib/radio';
import Row from 'antd/lib/row';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import debounce from 'debounce-promise';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { usePythonFunctionsList } from '../../api/REUses';
import Constants from '../../constants/Constants';
import featureGroups from '../../stores/reducers/featureGroups';
import { memProjectById } from '../../stores/reducers/projects';
import { PythonFunctionTypeParam } from '../../stores/reducers/pythonFunctions';
import { EditorElemPreview } from '../EditorElem/EditorElem';
import EditorElemForFeatureGroup from '../EditorElemForFeatureGroup/EditorElemForFeatureGroup';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import PartsLink from '../NavLeft/PartsLink';
import PythonFunctionConfigEditor from '../PythonFunctionConfigEditor/PythonFunctionConfigEditor';
import SelectExt from '../SelectExt/SelectExt';
import StoreActions from '../../stores/actions/StoreActions';

const styles = require('./EDAPythonFunctions.module.css');
const sd = require('../antdUseDark.module.css');

interface EDAPythonFunctionsProps {
  isEditFeatureGroupId?: string;
}

const EDAPythonFunctions = React.memo((props: PropsWithChildren<EDAPythonFunctionsProps>) => {
  const { authUser, paramsProp, featureGroupsParam, projectsParam } = useSelector((state: any) => ({
    authUser: state.authUser,
    paramsProp: state.paramsProp,
    featureGroupsParam: state.featureGroups,
    projectsParam: state.projects,
  }));

  const [form] = Form.useForm();
  const refEditorSql = useRef(null);
  const [previewDataFilterSQL, setPreviewDataFilterSQL] = useState(null);
  const [currentPythonFunction, setCurrentPythonFunction] = useState(null);
  const [pythonFunctionType, setPythonFunctionType] = useState('new');
  const [currentPlot, setCurrentPlot] = useState({} as any);
  const [pythonConfig, setPythonConfig] = useState([]);

  const getPythonFunctionBindings = () =>
    pythonConfig.map((item) => ({
      name: item.name,
      variableType: item.type,
      value: item.value,
    }));

  let projectId = paramsProp?.get('projectId');
  if (Utils.isNullOrEmpty(projectId) || projectId === '-') {
    projectId = null;
  }

  const organizationId = authUser.getIn(['data', 'organization', 'organizationId']);
  const graphDashboardId = paramsProp?.get('graphDashboardId');
  const pythonFunctionId = paramsProp?.get('pythonFunctionId');
  const plotReferenceId = paramsProp?.get('plotReferenceId');
  const plotName = paramsProp?.get('plotName');
  const isAdd = paramsProp?.get('isAdd');

  useEffect(() => {
    featureGroups.memFeatureGroupTypesForAdd(true);
  }, [featureGroupsParam]);

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projectsParam, projectId]);

  const featuresGroupsList = useMemo(() => {
    return featureGroups.memFeatureGroupsForProjectId(false, projectId);
  }, [featureGroupsParam, projectId]);
  useEffect(() => {
    featureGroups.memFeatureGroupsForProjectId(true, projectId);
  }, [featureGroupsParam, projectId]);

  const [allFG, setAllFG] = useState(null);

  useEffect(() => {
    if (allFG == null && projectId == null) {
      REClient_.client_()._listFeatureGroupsDashboard(null, 5000, null, null, null, (err, res) => {
        setAllFG(
          res?.result?.sort((a, b) => {
            return (a.tableName ?? a.name)?.toLowerCase()?.localeCompare((b.tableName ?? b.name)?.toLowerCase());
          }) ?? [],
        );
      });
    }
  }, [projectId, allFG]);

  useEffect(() => {
    let featureGroupIds = featuresGroupsList?.map?.((featureGroup) => featureGroup.featureGroupId) || [];
    if (props.isEditFeatureGroupId) {
      featureGroups.memFeatureGroupsForId(true, projectId, props.isEditFeatureGroupId);
    }
    featureGroups.memFeatureGroupsIdList(true, featureGroupIds);
  }, [featuresGroupsList, featureGroupsParam, projectId]);

  const onChangePythonFunctionType = (e) => {
    setPythonFunctionType(e.target.value);
    if (e.target.value === 'new') {
      setCurrentPythonFunction(null);
      form?.setFieldValue('sql', '');
      form?.setFieldValue('functionName', '');
    }
  };

  const handleSubmit = async (values) => {
    const pythonFunctionBindings = getPythonFunctionBindings();
    try {
      let response: any = {};
      if (isAdd) {
        let pythonFunctionId = null;
        if (pythonFunctionType === 'new') {
          const functionName = values.inputFunctionName;
          response = await REClient_.promises_()._getPythonFunctionCodeTemplate(functionName, pythonFunctionBindings, 'PYTHON_FEATURE_GROUP');
          if (!response?.success || response?.error) {
            throw new Error(response?.error);
          }
          response = await REClient_.promises_().createPythonFunction(functionName, response?.result || '', functionName, null, projectId, null, PythonFunctionTypeParam.PLOTLY_FIG);
          if (!response?.success || response?.error) {
            throw new Error(response?.error);
          }
          StoreActions.listPythonFunctions_(PythonFunctionTypeParam.PLOTLY_FIG);
          pythonFunctionId = response?.result?.pythonFunctionId;
        } else {
          pythonFunctionId = values.functionName.value;
        }
        response = await REClient_.promises_().addGraphToDashboard(pythonFunctionId, graphDashboardId, pythonFunctionBindings, values?.name);
      } else {
        response = await REClient_.promises_().updateGraphToDashboard(plotReferenceId, pythonFunctionBindings, values?.name);
      }
      if (!response?.success || response?.error) {
        throw new Error(response?.error);
      }
      Location.push(`/${PartsLink.exploratory_data_analysis_graphs_one}/${projectId ?? '-'}`, undefined, `plots=1&graphDashboardId=${encodeURIComponent(graphDashboardId)}`);
    } catch (error) {
      REActions.addNotificationError(error?.message || Constants.errorDefault);
    }
  };

  const pythonFunctionList = usePythonFunctionsList(PythonFunctionTypeParam.PLOTLY_FIG);
  const pythonFunctionOptions = useMemo(() => {
    return pythonFunctionList?.map((item) => ({ label: item.name, value: item.pythonFunctionId, data: item }));
  }, [pythonFunctionList]);

  useEffect(() => {
    const pythonFunction = pythonFunctionList?.find?.((item) => item.pythonFunctionId === pythonFunctionId);
    setCurrentPythonFunction(pythonFunction);
  }, [pythonFunctionList, pythonFunctionId]);

  useEffect(() => {
    const newPythonConfig = [];
    currentPythonFunction?.functionVariableMappings?.forEach?.((item, index) => {
      const functionBinding = currentPlot?.functionVariableMappings?.[index] || {};
      const validTypes = [item?.variable_type];
      const type = validTypes?.includes?.(functionBinding.variable_type) ? functionBinding.variable_type : validTypes[0];

      newPythonConfig.push({
        name: item.name,
        isRequired: item?.is_required,
        value: functionBinding.value,
        type,
        validTypes,
      });
    });

    setPythonConfig(newPythonConfig);
  }, [currentPythonFunction, currentPlot]);

  const onChangePythonConfig = (newPythonConfig) => {
    setPythonConfig(newPythonConfig);
  };

  const onClickOpenNotebook = (e) => {
    e.preventDefault();
    Location.push(`/${PartsLink.python_functions_one}/${projectId ?? '-'}/${encodeURIComponent(currentPythonFunction?.functionName)}`, undefined, 'notebookId=' + encodeURIComponent(currentPythonFunction?.notebookId), false, true);
  };

  const onChangeFunction = (option) => {
    const pythonFunction = pythonFunctionList?.find?.((item) => item.pythonFunctionId === option?.value);
    setCurrentPythonFunction(pythonFunction);
    form?.setFieldValue('sql', pythonFunction?.codeSource?.sourceCode);
    form?.setFieldValue('functionName', option);
  };

  const getGraphForDashboard = async () => {
    try {
      const response = await REClient_.promises_().describeGraphForDashboard(plotReferenceId);
      if (!response?.success || response?.error) {
        throw new Error(response?.error);
      }
      setCurrentPlot(response?.result);
    } catch (error) {
      REActions.addNotificationError(error?.message || Constants.errorDefault);
    }
  };

  useEffect(() => {
    if (!plotReferenceId) {
      return;
    }
    getGraphForDashboard();
  }, [plotReferenceId]);

  const previewRef = useRef({
    previewData: previewDataFilterSQL,
    setPreviewData: (newValue) => {
      previewRef.current = { ...previewRef.current };
      previewRef.current.previewData = newValue;
      setPreviewDataFilterSQL(newValue);
    },
  });
  const onCancelClick = () => {
    Location.push(`/${PartsLink.exploratory_data_analysis_graphs_one}/${projectId ?? '-'}`, undefined, `plots=1&graphDashboardId=${encodeURIComponent(graphDashboardId)}`);
  };

  const initialValues = useMemo(() => {
    const currentFunction = pythonFunctionOptions?.find?.((item) => item.value === pythonFunctionId);
    const sql = currentFunction?.data?.codeSource?.sourceCode || '';
    const name = currentPlot?.plotName;
    return {
      sql,
      functionName: currentFunction,
      name,
    };
  }, [pythonFunctionId, plotName, currentPlot]);

  useEffect(() => {
    form?.setFieldsValue?.(initialValues);
  }, [form, initialValues]);

  const checkIsFunctionNameUsed = async (name: string) => {
    try {
      const response = await REClient_.promises_()._isPythonFunctionNameUsed(name, organizationId);
      if (!response?.success || response?.result) {
        throw new Error(`Python function "${name}" already exists`);
      }
    } catch (error) {
      return Promise.reject(error);
    }
    return Promise.resolve();
  };
  const checkIsFunctionNameUsedDebounced = debounce(checkIsFunctionNameUsed, 240);

  const uniqueFunctionNameValidator = () => ({
    validator(_: any, name: string) {
      if (!name || !organizationId) return Promise.resolve();
      return checkIsFunctionNameUsedDebounced(name);
    },
  });

  return (
    <div style={{ margin: '0 30px' }}>
      <div style={{ margin: '30px auto', maxWidth: '1200px', color: Utils.colorA(1) }}>
        <EditorElemPreview.Provider value={previewRef.current}>
          <Card style={{ boxShadow: '0 0 4px rgba(0,0,0,0.2)', border: '1px solid ' + Utils.colorA(0.5), backgroundColor: Utils.colorA(0.04), borderRadius: '5px' }} className={sd.grayPanel}>
            <FormExt layout={'vertical'} form={form} onFinish={handleSubmit} initialValues={initialValues}>
              <div>
                <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                  <span style={{ color: '#ff4d4f', marginRight: '4px', fontSize: '14px', fontFamily: 'SimSun, sans-serif' }}>*</span>
                  Title:
                </span>
                <Form.Item rules={[{ required: true, message: 'Required!' }]} name={'name'} style={{ margin: '10px 0' }} hasFeedback>
                  <Input
                    css={`
                      &.ant-input.ant-input-disabled {
                        background-color: #424242 !important;
                      }
                    `}
                    autoComplete={'off'}
                  />
                </Form.Item>
              </div>
              <div>
                <div
                  css={`
                    display: flex;
                    position: relative;
                  `}
                >
                  <div
                    css={`
                      flex: 1;
                    `}
                  >
                    <div style={{ marginTop: '10px' }}>
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        <span style={{ color: '#ff4d4f', marginRight: '4px', fontSize: '14px', fontFamily: 'SimSun, sans-serif' }}>*</span>
                        Python Function:
                        <HelpIcon id={'python_func_list_title'} style={{ marginLeft: 4 }} />
                        {isAdd && (
                          <Radio.Group style={{ marginLeft: '30px' }} value={pythonFunctionType} onChange={onChangePythonFunctionType}>
                            <Radio value={'new'}>
                              <span
                                css={`
                                  color: white;
                                `}
                              >
                                New Function
                              </span>
                            </Radio>
                            <Radio value={'exist'}>
                              <span
                                css={`
                                  color: white;
                                `}
                              >
                                Existing Function
                              </span>
                            </Radio>
                          </Radio.Group>
                        )}
                      </span>
                      <Row gutter={20} style={{ marginTop: '10px' }}>
                        {isAdd && (
                          <Col flex="auto">
                            {pythonFunctionType === 'new' && (
                              <Form.Item rules={[{ required: true, message: 'Required!' }, uniqueFunctionNameValidator]} name={'inputFunctionName'} hasFeedback>
                                <Input disabled={!!props.isEditFeatureGroupId} placeholder="" autoComplete={'off'} />
                              </Form.Item>
                            )}
                            {pythonFunctionType === 'exist' && (
                              <Form.Item name={'functionName'} rules={[{ required: true, message: 'Required' }]} noStyle>
                                <SelectExt options={pythonFunctionOptions ?? []} onChange={onChangeFunction} />
                              </Form.Item>
                            )}
                          </Col>
                        )}
                        {!isAdd && (
                          <Col flex="auto">
                            <Form.Item name={'functionName'} rules={[{ required: true, message: 'Required' }]} noStyle>
                              <SelectExt isDisabled options={pythonFunctionOptions ?? []} onChange={onChangeFunction} />
                            </Form.Item>
                          </Col>
                        )}
                        {currentPythonFunction && (
                          <Col>
                            <Button type="primary" className="login-form-button" onClick={onClickOpenNotebook}>
                              Open In Notebook
                            </Button>
                          </Col>
                        )}
                      </Row>
                    </div>
                    {currentPythonFunction && (
                      <div
                        css={`
                          display: flex;
                        `}
                      >
                        <div
                          css={`
                            flex: 1;
                          `}
                        >
                          <Form.Item
                            style={{ marginBottom: 10 }}
                            label={
                              <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                                Feature Groups/Arguments to Pass To Python Function:
                                <HelpIcon id={''} />
                              </span>
                            }
                          ></Form.Item>
                          <div
                            css={`
                              margin-top: -30px;
                              margin-right: 10px;
                              position: relative;
                            `}
                          >
                            <PythonFunctionConfigEditor featureGroupId={props.isEditFeatureGroupId} config={pythonConfig} onChange={onChangePythonConfig} />
                          </div>
                        </div>
                        <div
                          css={`
                            flex: 1;
                          `}
                        >
                          <Form.Item
                            name={'sql'}
                            rules={[{ required: true, message: 'Code required!' }]}
                            style={{ marginBottom: 0 }}
                            label={
                              <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                                Python Function Code
                                <HelpIcon id="fg_add_code" style={{ marginLeft: 4 }} />
                              </span>
                            }
                          >
                            <EditorElemForFeatureGroup readSure readonly lang="python" lineNumbers={true} onlyThisFeatureGroup={false} allowResizeHeight={'fg_add_editor_hh'} projectId={projectId} refEditor={refEditorSql} />
                          </Form.Item>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>
              <div
                style={{ textAlign: 'center' }}
                css={`
                  position: relative;
                `}
              >
                <Button type="primary" htmlType="submit" style={{ margin: '16px 4px 0 0' }}>
                  {isAdd ? 'Create Plot' : 'Save'}
                </Button>
                <Button type="primary" style={{ margin: '16px 4px 0 0' }} onClick={onCancelClick}>
                  Cancel
                </Button>
              </div>
            </FormExt>
          </Card>
        </EditorElemPreview.Provider>
      </div>
    </div>
  );
});

export default EDAPythonFunctions;
