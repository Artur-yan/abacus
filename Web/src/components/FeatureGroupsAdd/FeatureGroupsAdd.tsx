import { LoadingOutlined } from '@ant-design/icons';
import CopyOutlined from '@ant-design/icons/CopyOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Checkbox from 'antd/lib/checkbox';
import Col from 'antd/lib/col';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Radio from 'antd/lib/radio';
import Row from 'antd/lib/row';
import Spin from 'antd/lib/spin';
import classNames from 'classnames';
import debounce from 'debounce-promise';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Provider, useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import UtilsWeb from '../../../core/UtilsWeb';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { usePythonFunctionsList, useTemplate } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
import featureGroups from '../../stores/reducers/featureGroups';
import projectDatasets from '../../stores/reducers/projectDatasets';
import { memProjectById } from '../../stores/reducers/projects';
import { ETemplatesOneTypeDefault, ITemplateConfig, ITemplateConfigOne, PythonFunctionArgumentDefaultType, PythonFunctionArgumentInitialValues, convertBEToConfig, convertConfigToBE } from '../../stores/reducers/templates';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import CpuAndMemoryOptions from '../CpuAndMemoryOptions/CpuAndMemoryOptions';
import EditorElem, { EditorElemPreview, EditorElemPreviewGrid } from '../EditorElem/EditorElem';
import EditorElemForFeatureGroup from '../EditorElemForFeatureGroup/EditorElemForFeatureGroup';
import { FGLangType, FGLockType, calcLangType } from '../FeatureGroups/FGLangType';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import PythonFunctionConfigEditor from '../PythonFunctionConfigEditor/PythonFunctionConfigEditor';
import PythonPromptAdv from '../PythonPromptAdv/PythonPromptAdv';
import SelectExt from '../SelectExt/SelectExt';
import SelectReactExt from '../SelectReactExt/SelectReactExt';
import TemplateConfigEditor from '../TemplateConfigEditor/TemplateConfigEditor';

import { normValueForTemplate } from '../TemplateOne/TemplateOne';
const styles = require('./FeatureGroupsAdd.module.css');
const sd = require('../antdUseDark.module.css');

const FormItemPackage = (props) => <span style={{ color: 'white' }}>{props?.value}</span>;

interface IFeatureGroupsAddProps {
  isEditFeatureGroupId?: string;
}

const FeatureGroupsAdd = React.memo((props: PropsWithChildren<IFeatureGroupsAddProps>) => {
  const { paramsProp, featureGroupsParam, projectDatasetsParam, projectsParam, useCasesParam, authUser } = useSelector((state: any) => ({
    authUser: state.authUser,
    paramsProp: state.paramsProp,
    featureGroupsParam: state.featureGroups,
    useCasesParam: state.useCases,
    projectsParam: state.projects,
    projectDatasetsParam: state.projectDatasets,
  }));

  const organizationId = authUser.getIn(['data', 'organization', 'organizationId']);
  const [form] = Form.useForm();
  const newFunctionNameValue = Form.useWatch('functionName', form);
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const refEditorSql = useRef(null);
  const [previewDataFilterSQL, setPreviewDataFilterSQL] = useState(null);
  const [isRefreshingEditorFilter, setIsRefreshingEditorFilter] = useState(false);
  const [isCurrentChanged, setIsCurrentChanged] = useState(false);
  const [pythonFunctionType, setPythonFunctionType] = useState('new');
  const [pythonFunctionName, setPythonFunctionName] = useState(null);
  const [addPythonPackageButtonDisabled, setAddPythonPackageButtonDisabled] = useState(true);
  const [promptText, setPromptText] = useState('');
  const [isRefreshGenerateSQL, setIsRefreshGenerateSQL] = useState(false);
  const [sqlRes, setSQLRes] = useState([]);
  const refSqlLast = useRef(null);
  const [hasNestedPitCols, setHasNestedPitCols] = useState(false);

  const cpuAndMemoryRef = useRef(null);
  const sqlUsed = form?.getFieldValue('sql');

  const [config, setConfig] = useState(null as ITemplateConfig);
  const [configOri, setConfigOri] = useState(null as ITemplateConfig);

  const [pythonConfig, setPythonConfig] = useState([]);

  const isOnlyTags = paramsProp?.get('onlyTags') === '1';

  let projectId = paramsProp?.get('projectId');
  if (Utils.isNullOrEmpty(projectId) || projectId === '-') {
    projectId = null;
  }

  let useTemplateId = paramsProp?.get('useTemplateId');
  if (useTemplateId === '' || useTemplateId === '-') {
    useTemplateId = null;
  }
  const isTemplate = useTemplateId != null;

  let useConfigParam = paramsProp?.get('useConfig');
  if (Utils.isNullOrEmpty(useConfigParam)) {
    useConfigParam = null;
  }
  let useConfig = useMemo(() => {
    let useConfig = useConfigParam;
    if (useConfig != null) {
      useConfig = Utils.tryJsonParse(useConfig);
    }
    return useConfig;
  }, [useConfigParam]);

  const pythonFunctionNameUsed = paramsProp?.get('pythonFunctionName');

  const getPythonFunctionBindings = () =>
    pythonConfig.map((item) => ({
      name: item.name,
      variableType: item.type,
      isRequired: item.isRequired,
      value: item?.value === '' ? null : item?.value,
    }));

  useEffect(() => {
    if (useConfig != null) {
      setConfig(useConfig);
    }
  }, [useConfig]);

  let hideTemplate = paramsProp?.get('hideTemplate') === '1';
  let fullEdit = paramsProp?.get('fullEdit') === '1';

  const fromFeatureGroupList = paramsProp?.get('fromFeatureGroupList') === '1';

  useEffect(() => {
    featureGroups.memFeatureGroupTypesForAdd(true);
  }, [featureGroupsParam]);

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projectsParam, projectId]);
  const foundProject1 = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projectsParam, projectId]);

  const featuresGroupsList = useMemo(() => {
    return featureGroups.memFeatureGroupsForProjectId(false, projectId);
  }, [featureGroupsParam, projectId]);
  useEffect(() => {
    featureGroups.memFeatureGroupsForProjectId(true, projectId);
  }, [featureGroupsParam, projectId]);

  const templateOne = useTemplate(useTemplateId);

  const templateAlreadyInit = useRef(false);
  useEffect(() => {
    templateAlreadyInit.current = false;
  }, [useTemplateId]);
  useEffect(() => {
    if (templateAlreadyInit.current) {
      return;
    }

    if (isTemplate && templateOne != null) {
      templateAlreadyInit.current = true;

      let { templateSql, templateVariables, templateBindings } = templateOne ?? {};
      form?.setFieldsValue({ sql: templateSql || '' });

      let config1 = convertBEToConfig(templateVariables);
      setConfigOri(config1 ?? null);
      if (useConfig == null && !props.isEditFeatureGroupId) {
        setConfig(config1 ?? null);
      }
    }
  }, [templateOne, isTemplate, useConfig, props.isEditFeatureGroupId]);

  const [allFG, setAllFG] = useState(null);
  const [isAllFGRefreshing, setIsAllFGRefreshing] = useState(false);

  useEffect(() => {
    if (allFG == null && projectId == null) {
      setIsAllFGRefreshing(true);
      REClient_.client_()._listFeatureGroupsDashboard(null, 5000, null, null, null, (err, res) => {
        setAllFG(
          res?.result?.sort((a, b) => {
            return (a.tableName ?? a.name)?.toLowerCase()?.localeCompare((b.tableName ?? b.name)?.toLowerCase());
          }) ?? [],
        );
        setIsAllFGRefreshing(false);
      });
    }
  }, [projectId, allFG]);

  const featureGroupDescriptionsDict = useMemo(() => {
    let res: any = {};

    let featureGroupIds = featuresGroupsList?.map?.((featureGroup) => featureGroup.featureGroupId) || [];
    if (props.isEditFeatureGroupId && !featureGroupIds.includes(props.isEditFeatureGroupId)) {
      featureGroupIds.push(props.isEditFeatureGroupId);
    }

    const featureGroupDescriptionList = featureGroups.memFeatureGroupsIdList(false, featureGroupIds);
    featureGroupDescriptionList?.forEach((featureGroupDescription) => {
      res[featureGroupDescription?.featureGroupId] = featureGroupDescription;
    });
    return res;
  }, [featuresGroupsList, featureGroupsParam, projectId]);

  useEffect(() => {
    let featureGroupIds = featuresGroupsList?.map?.((featureGroup) => featureGroup.featureGroupId) || [];
    if (props.isEditFeatureGroupId) {
      featureGroups.memFeatureGroupsForId(true, projectId, props.isEditFeatureGroupId);
    }
    featureGroups.memFeatureGroupsIdList(true, featureGroupIds);
  }, [featuresGroupsList, featureGroupsParam, projectId]);

  const featureGroupEditOne = useMemo(() => {
    let g1: any = Object.values(featureGroupDescriptionsDict).find((v1: any) => v1 && v1.featureGroupId === props.isEditFeatureGroupId);
    return g1;
  }, [props.isEditFeatureGroupId, featureGroupDescriptionsDict]);

  const useType = paramsProp?.get('useType');
  const useLang: FGLangType = useMemo(() => {
    if (useType) {
      return useType;
    }
    if (featureGroupEditOne != null) {
      return calcLangType(featureGroupEditOne?.featureGroupSourceType);
    }
  }, [useType, featureGroupEditOne]);

  React.useEffect(() => {
    form?.setFieldValue?.('packageRequirements', ['', ...(featureGroupEditOne?.codeSource?.packageRequirements || [])]);
  }, [featureGroupEditOne]);

  useEffect(() => {
    if (useLang === FGLangType.Python) {
      const functionName = featureGroupEditOne?.pythonFunctionName ?? featureGroupEditOne?.functionName ?? pythonFunctionNameUsed;
      setPythonFunctionName(functionName);
    }
  }, [pythonFunctionNameUsed, featureGroupEditOne, useLang]);

  let pythonPromptAdvElem = null;
  if (!Constants.disableAiFunctionalities && calcAuthUserIsLoggedIn()?.isInternal === true) {
    pythonPromptAdvElem = (
      <ModalConfirm
        width={1100}
        title={
          <Provider store={Utils.globalStore()}>
            <div className={'useDark'}>
              <PythonPromptAdv projectId={projectId} />
            </div>
          </Provider>
        }
        okText={'Close'}
        cancelText={null}
        okType={'primary'}
      >
        <Button type={'primary'} size={'small'} ghost>
          Advanced
        </Button>
      </ModalConfirm>
    );
  }

  const refreshPythonFunctionTemplate = (functionName, pythonFunctionBindings) => {
    // console.log('pythonFunctionType', functionName, pythonFunctionBindings);

    REClient_.client_()._getPythonFunctionCodeTemplate(functionName, pythonFunctionBindings, 'PYTHON_FEATURE_GROUP', (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        form?.setFieldValue('sql', res?.result || '');
      }
    });
  };

  const handleSubmit = (values) => {
    const pythonFunctionBindings = getPythonFunctionBindings();
    // TODO: remove callback hell and use async await
    const doWork = (cbFinish) => {
      if (useLang === FGLangType.Streaming) {
        let fgConcatId = values.sourceFG?.value;
        REClient_.client_().concatenateFeatureGroupData(fgConcatId, values.streamingFG?.value, null, null, values.skipMaterialize, (errA, resA) => {
          if (errA || !resA?.success) {
            if (resA?.sqlError) {
              cbFinish?.(resA?.sqlError);
            } else {
              cbFinish?.();
              REActions.addNotificationError(errA || Constants.errorDefault);
            }
          } else {
            cbFinish?.();
            StoreActions.getProjectDatasets_(projectId, (res, ids) => {
              StoreActions.listDatasets_(ids);
            });
            StoreActions.featureGroupsGetByProject_(projectId, (list) => {
              list?.some((f1) => {
                StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
              });
            });
            StoreActions.featureGroupsDescribe_(projectId, fgConcatId);
            StoreActions.featureGroupsDescribe_(null, fgConcatId);

            Location.push('/' + PartsLink.feature_group_detail + '/' + projectId + '/' + fgConcatId /*resA?.featureGroupId*/);
          }
        });
        return;
      }

      let memoryGB = values.memory;
      if (memoryGB?.value != null) {
        memoryGB = memoryGB?.value;
      }

      const functionName = pythonFunctionType === 'exist' ? values.selectedFunctionName?.value : values.functionName;

      const forceRefreshFGOne = (featureGroupId) => {
        StoreActions.refreshDoFGAll_(projectId, featureGroupId, (res) => res?.result?.codeSource == null || ['FAILED', 'COMPLETE'].includes(res?.result?.codeSource?.status));
      };

      if (!props.isEditFeatureGroupId) {
        const cbCreate = (err, res) => {
          if (err || !res?.success) {
            if (res?.sqlError) {
              cbFinish?.(res?.sqlError);
            } else {
              cbFinish?.();
              REActions.addNotificationError(err || Constants.errorDefault);
            }
          } else {
            let featureGroupId = res?.result?.featureGroupId;

            if (projectId == null) {
              cbFinish?.();
              Location.push('/' + PartsLink.feature_group_detail + '/-/' + featureGroupId);
            } else {
              const datasetType = values.datasetType?.value;
              REClient_.client_().attachFeatureGroupToProject(featureGroupId, projectId, datasetType, (errA, resA) => {
                if (errA || !resA?.success) {
                  if (resA?.sqlError) {
                    cbFinish?.(resA?.sqlError);
                  } else {
                    cbFinish?.();
                    REActions.addNotificationError(errA || Constants.errorDefault);
                  }
                } else {
                  cbFinish?.();
                  StoreActions.getProjectDatasets_(projectId, (res, ids) => {
                    StoreActions.listDatasets_(ids);
                  });
                  StoreActions.featureGroupsGetByProject_(projectId, (list) => {
                    list?.some((f1) => {
                      StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
                    });
                  });

                  Location.push('/' + PartsLink.feature_group_detail + '/' + projectId + '/' + featureGroupId, undefined, 'useFGadded=' + encodeURIComponent(values.tableName ?? ''));
                }
              });
            }
          }
        };

        if (useLang === FGLangType.Python) {
          if (pythonFunctionOne) {
            let inputFeatureGroups = null;
            let ff = values.inputFeatureGroups;
            if (ff != null && ff.length > 0) {
              inputFeatureGroups = JSON.stringify(ff);
            }

            REClient_.client_().createFeatureGroupFromFunction(
              values.tableName,
              null,
              null,
              inputFeatureGroups,
              values.description,
              values.tags,
              values.lockType?.value,
              memoryGB,
              values.cpuSize?.value,
              functionName,
              pythonFunctionBindings,
              (err2, res2) => {
                if (err2 || !res2?.success) {
                  if (res2?.sqlError) {
                    cbFinish?.(res2?.sqlError);
                  } else {
                    cbFinish?.();
                    REActions.addNotificationError(err2 || Constants.errorDefault);
                  }
                } else {
                  let featureGroupId = res2?.result?.featureGroupId;

                  if (projectId == null) {
                    forceRefreshFGOne(featureGroupId);

                    cbFinish?.();
                    Location.push('/' + PartsLink.feature_group_detail + '/-/' + featureGroupId);
                  } else {
                    const datasetType = values.datasetType?.value;
                    REClient_.client_().attachFeatureGroupToProject(featureGroupId, projectId, datasetType, (err3, res3) => {
                      if (err3 || !res3?.success) {
                        if (res3?.sqlError) {
                          cbFinish?.(res3?.sqlError);
                        } else {
                          cbFinish?.();
                          REActions.addNotificationError(err3 || Constants.errorDefault);
                        }
                      } else {
                        forceRefreshFGOne(featureGroupId);

                        cbFinish?.();
                        Location.push('/' + PartsLink.feature_group_detail + '/' + projectId + '/' + featureGroupId);
                      }
                    });
                  }
                }
              },
            );
          } else {
            if (pythonFunctionBindings.length !== getValidPythonArgs(pythonFunctionBindings)?.length) {
              REActions.addNotificationError('Invalid python function arguments');
              setIsRefreshingEditorFilter(false);
              return;
            }

            // Remove the first item as its used to store the input value
            values?.packageRequirements?.shift?.();
            REClient_.client_()._getPythonFunctionCodeTemplate(functionName, pythonFunctionBindings, 'PYTHON_FEATURE_GROUP', (err, res) => {
              if (err || !res?.success) {
                cbFinish?.();
                REActions.addNotificationError(err || Constants.errorDefault);
              } else {
                StoreActions.listPythonFunctions_();

                let inputFeatureGroups = null;
                let ff = values.inputFeatureGroups;
                if (ff != null && ff.length > 0) {
                  inputFeatureGroups = JSON.stringify(ff);
                }
                REClient_.client_().createFeatureGroupFromFunction(
                  values.tableName,
                  res?.result || values.sql,
                  functionName,
                  inputFeatureGroups,
                  values.description,
                  values.tags,
                  values.lockType?.value,
                  memoryGB,
                  values.cpuSize?.value,
                  functionName,
                  pythonFunctionBindings,
                  (err2, res2) => {
                    if (err2 || !res2?.success) {
                      if (res2?.sqlError) {
                        cbFinish?.(res2?.sqlError);
                      } else {
                        cbFinish?.();
                        REActions.addNotificationError(err2 || Constants.errorDefault);
                      }
                    } else {
                      let featureGroupId = res2?.result?.featureGroupId;
                      const pythonFunctionName = res2?.result?.pythonFunctionName;
                      REClient_.client_().describePythonFunction(pythonFunctionName, (desErr, desRes) => {
                        if (desErr || !desRes?.success) {
                          if (desRes?.sqlError) {
                            cbFinish?.(desRes?.sqlError);
                          } else {
                            cbFinish?.();
                            REActions.addNotificationError(desErr || Constants.errorDefault);
                          }
                        } else {
                          if (projectId == null) {
                            forceRefreshFGOne(featureGroupId);

                            cbFinish?.();
                            Location.push('/' + PartsLink.python_functions_one + '/-/' + encodeURIComponent(functionName), undefined, 'notebookId=' + encodeURIComponent(desRes?.result?.notebookId));
                          } else {
                            const datasetType = values.datasetType?.value;
                            REClient_.client_().attachFeatureGroupToProject(featureGroupId, projectId, datasetType, (err3, res3) => {
                              if (err3 || !res3?.success) {
                                if (res3?.sqlError) {
                                  cbFinish?.(res3?.sqlError);
                                } else {
                                  cbFinish?.();
                                  REActions.addNotificationError(err3 || Constants.errorDefault);
                                }
                              } else {
                                forceRefreshFGOne(featureGroupId);

                                cbFinish?.();
                                Location.push('/' + PartsLink.python_functions_one + '/' + projectId + '/' + encodeURIComponent(functionName), undefined, 'notebookId=' + encodeURIComponent(desRes?.result?.notebookId));
                              }
                            });
                          }
                        }
                      });
                    }
                  },
                );
              }
            });
          }
        } else {
          if (isTemplate) {
            setConfig((c1) => {
              let config1 = convertConfigToBE(c1);
              REClient_.client_().createFeatureGroupFromTemplate(values.tableName, useTemplateId, config1, true, values.description, values.lockType?.value, values.tags, cbCreate);

              return c1;
            });
          } else {
            REClient_.client_().createFeatureGroup(values.tableName, values.sql, values.description, values.tags, values.lockType?.value, cbCreate);
          }
        }
      } else {
        REClient_.client_().updateFeatureGroup(props.isEditFeatureGroupId, null, values.description, values.tags, (err, res) => {
          if (err || !res?.success) {
            if (res?.sqlError) {
              cbFinish?.(res?.sqlError);
            } else {
              cbFinish?.();
              REActions.addNotificationError(err || Constants.errorDefault);
            }
          } else {
            const cbEndUpdate = (err, res) => {
              if (err || !res?.success) {
                if (res?.sqlError) {
                  cbFinish?.(res?.sqlError);
                } else {
                  cbFinish?.();
                  REActions.addNotificationError(err || Constants.errorDefault);
                }
              } else {
                cbFinish?.();
                if (useLang === FGLangType.Python) {
                  forceRefreshFGOne(props.isEditFeatureGroupId);

                  StoreActions.listPythonFunctions_();
                  StoreActions.describePythonFunctionTillCodeCheckComplete_(res.result.functionName);
                }
                if (projectId == null) {
                  StoreActions.featureGroupsDescribe_(null, props.isEditFeatureGroupId);
                  featureGroupEditOne?.projects?.some((p1) => {
                    StoreActions.featureGroupsDescribe_(p1?.projectId, props.isEditFeatureGroupId);
                  });

                  Location.push('/' + PartsLink.feature_group_detail + '/-/' + props.isEditFeatureGroupId, undefined, 'regenerateExplanation=true');
                } else {
                  StoreActions.getProjectDatasets_(projectId, (res, ids) => {
                    StoreActions.listDatasets_(ids);
                  });

                  let alreadyProjectUsed: any = {};
                  StoreActions.featureGroupsGetByProject_(projectId, (list) => {
                    list?.some((f1) => {
                      alreadyProjectUsed[projectId] = true;
                      StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
                    });
                  });

                  StoreActions.featureGroupsDescribe_(null, props.isEditFeatureGroupId);
                  featureGroupEditOne?.projects?.some((p1) => {
                    let projectId1 = p1?.projectId;
                    if (alreadyProjectUsed[projectId1] == null) {
                      alreadyProjectUsed[projectId1] = true;
                      StoreActions.featureGroupsDescribe_(projectId1, props.isEditFeatureGroupId);
                    }
                  });

                  Location.push('/' + PartsLink.feature_group_detail + '/' + projectId + '/' + props.isEditFeatureGroupId, undefined, 'useFGupdated=' + encodeURIComponent(values.tableName ?? '') + '&regenerateExplanation=true');
                }
              }
            };

            if (isTemplate) {
              if (hideTemplate) {
                cbEndUpdate(null, { success: true });
              } else {
                setConfig((c1) => {
                  if (fullEdit) {
                    REClient_.client_().updateFeatureGroupTemplate(useTemplateId, null, values.sql ?? refSqlLast.current.sql, null, convertConfigToBE(c1), (err, res) => {
                      REClient_.client_().updateFeatureGroupTemplateBindings(props.isEditFeatureGroupId, convertConfigToBE(c1), cbEndUpdate);
                    });
                  } else {
                    REClient_.client_().updateFeatureGroupTemplateBindings(props.isEditFeatureGroupId, convertConfigToBE(c1), cbEndUpdate);
                  }

                  return c1;
                });
              }
            } else if (isOnlyTags) {
              cbEndUpdate(null, { success: true });
            } else if (useLang === FGLangType.Python) {
              let inputFeatureGroups = null;
              let ff = values.inputFeatureGroups;
              if (ff != null && ff.length > 0) {
                inputFeatureGroups = JSON.stringify(ff);
              }

              if (
                refSqlLast.current != null &&
                refSqlLast.current.sql === values.sql &&
                refSqlLast.current.functionName === functionName &&
                memoryGB === refSqlLast.current?.memoryGB &&
                _.isEqual(refSqlLast.current.inputFeatureGroups, inputFeatureGroups)
              ) {
                cbEndUpdate(null, { success: true });
              } else {
                // Remove the first item as its used to store the input value
                values?.packageRequirements?.shift?.();
                REClient_.client_().updateFeatureGroupFunctionDefinition(
                  props.isEditFeatureGroupId,
                  values.sql,
                  functionName,
                  inputFeatureGroups,
                  values.cpuSize?.value,
                  memoryGB,
                  values?.packageRequirements,
                  false,
                  pythonFunctionBindings,
                  cbEndUpdate,
                );
              }
            } else {
              if (refSqlLast.current?.sql === values.sql) {
                cbEndUpdate(null, { success: true });
              } else {
                REClient_.client_().updateFeatureGroupSqlDefinition(props.isEditFeatureGroupId, values.sql, cbEndUpdate);
              }
            }
          }
        });
      }
    };

    setIsRefreshingEditorFilter(true);

    if (isOnlyTags || hideTemplate) {
      doWork((err) => {
        setIsRefreshingEditorFilter(false);
      });
    } else if ([FGLangType.Streaming, FGLangType.Python].includes(useLang)) {
      doWork((err) => {
        setIsRefreshingEditorFilter(false);
      });
    } else {
      refEditorSql.current?.doProcessing('Saving...', () => {
        return new Promise((resolve) => {
          doWork((err) => {
            setIsRefreshingEditorFilter(false);
            resolve(err);
          });
        });
      });
    }
  };

  const schemaInfoUseCase = useMemo(() => {
    return memUseCasesSchemasInfo(false, foundProject1?.useCase);
  }, [useCasesParam, foundProject1?.useCase]);
  useEffect(() => {
    memUseCasesSchemasInfo(true, foundProject1?.useCase);
  }, [useCasesParam, foundProject1?.useCase]);

  const datasetTypeNull = useRef({
    label: Constants.custom_table_desc,
    value: Constants.custom_table,
  });

  const optionsDatasetType = useMemo(() => {
    let res = [];
    let resAlreadyByDatasetType = {};
    let alreadyCustom = false;

    if (schemaInfoUseCase) {
      schemaInfoUseCase.list?.some((sc1) => {
        if (!sc1) {
          return;
        }

        let datasetType = schemaInfoUseCase[sc1].dataset_type;

        if (!resAlreadyByDatasetType[datasetType]) {
          resAlreadyByDatasetType[datasetType] = true;
          res.push({
            value: datasetType?.toUpperCase(),
            label: schemaInfoUseCase[sc1]?.title,
          });

          if (datasetType?.toUpperCase() === Constants.custom_table) {
            alreadyCustom = true;
          }
        }
      });
    }

    if (!alreadyCustom) {
      res.unshift(datasetTypeNull.current);
    }

    return res;
  }, [schemaInfoUseCase]);

  const sample1 = `SELECT timestamp, user_id AS UserId, movies_table.movie_id, movies_table.rating AS Rating FROM movies_table`;

  const refOriValues = useRef(null as { tableName?; sql?; description? });

  const pythonFunctionList = usePythonFunctionsList();

  const pythonFunctionOptions = useMemo(() => {
    return pythonFunctionList?.map((item) => ({ label: item.name, value: item.name, data: item }));
  }, [pythonFunctionList]);

  const pythonFunctionOne = useMemo(() => {
    return pythonFunctionList?.find((item) => item.name === pythonFunctionName);
  }, [pythonFunctionList, pythonFunctionName]);

  const hasGetPythonArgumentsError = (err, res) => {
    if (err || !res?.success) {
      return true;
    }
    return false;
  };

  const initPythonConfig = (err, res) => {
    if (hasGetPythonArgumentsError(err, res)) return;
    const newPythonConfig = [];

    res?.result?.forEach?.((nextItem, index) => {
      const functionBinding = featureGroupEditOne?.pythonFunctionBindings?.[index] || {};
      const validTypes = nextItem?.validTypeOptions || [];
      const defaultType = validTypes.includes(PythonFunctionArgumentDefaultType) ? PythonFunctionArgumentDefaultType : validTypes[0];
      const type = validTypes?.includes?.(functionBinding.variableType) ? functionBinding.variableType : defaultType;

      newPythonConfig.push({
        name: nextItem.name,
        isRequired: nextItem?.required,
        value: functionBinding.value ?? pythonFunctionOne?.functionVariableMappings?.find((variableMapping) => variableMapping?.name === nextItem?.name)?.value,
        type,
        validTypes,
      });
    });

    setPythonConfig(newPythonConfig);
  };

  const updatePythonConfig = (err, res) => {
    if (hasGetPythonArgumentsError(err, res)) return;

    const newPythonConfig = [];
    res?.result?.forEach?.((nextItem, index) => {
      const currentConfigItem = pythonConfig?.[index] || {};
      const validTypes = nextItem?.validTypeOptions || [];
      const defaultType = validTypes.includes(PythonFunctionArgumentDefaultType) ? PythonFunctionArgumentDefaultType : validTypes[0];
      const type = validTypes?.includes?.(currentConfigItem.type) ? currentConfigItem.type : defaultType;
      const value = type === currentConfigItem?.type ? currentConfigItem?.value : PythonFunctionArgumentInitialValues[type];

      newPythonConfig.push({
        name: nextItem.name,
        isRequired: nextItem?.required,
        value: value ?? pythonFunctionOne?.functionVariableMappings?.find((variableMapping) => variableMapping?.name === nextItem?.name)?.value,
        type,
        validTypes,
      });
    });

    setPythonConfig(newPythonConfig);
  };

  useEffect(() => {
    if (!pythonFunctionOne?.codeSource?.sourceCode) return;
    REClient_.client_()._getPythonArguments(pythonFunctionOne?.functionName, pythonFunctionOne?.codeSource?.sourceCode, initPythonConfig);
  }, [pythonFunctionOne]);

  const getPythonArgumentsDebounced = _.debounce((code) => REClient_.client_()._getPythonArguments(pythonFunctionOne?.functionName, code, updatePythonConfig), 240);

  const onChangeFormPython = (sourceCode) => {
    getPythonArgumentsDebounced(sourceCode);
  };

  const onChangePythonConfig = (newPythonConfig) => {
    setPythonConfig(newPythonConfig);
  };
  const getValidPythonArgs = (pythonFunctionBindings) => pythonFunctionBindings?.filter((arg) => (arg.isRequired ? arg?.name && arg?.value !== null && arg?.value !== undefined && arg?.variableType : arg?.name && arg?.variableType)) || [];

  const refreshTemplateOnArgChange = (newPythonConfig) => {
    if (useLang === FGLangType.Python && !pythonFunctionNameUsed && newFunctionNameValue && pythonFunctionType === 'new' && !props.isEditFeatureGroupId) {
      const pythonFunctionBindings = newPythonConfig?.map((item) => ({
        name: item.name,
        variableType: item.type,
        isRequired: item.isRequired,
        value: item?.value === '' || item?.value === undefined ? null : item?.value,
      }));

      debouncedRefreshPythonFunctionTemplate(newFunctionNameValue, getValidPythonArgs(pythonFunctionBindings));
    }
  };

  const onGenerateSQL = () => {
    if (isRefreshGenerateSQL || !promptText || promptText?.trim() === '') return;

    setIsRefreshGenerateSQL(true);
    setSQLRes([]);

    REClient_.client_().queryFeatureGroupCodeGenerator(promptText, 'sql', projectId, (err, res) => {
      setIsRefreshGenerateSQL(false);
      if (err || !res || !res.result) {
      } else {
        const sqlContent = res.result?.content;
        if (sqlContent) {
          setSQLRes(parseSQLResContent(sqlContent) ?? []);
        }
      }
    });
  };

  const parseSQLResContent = (content) => {
    const contents = content?.split('```');
    const contentArr = contents?.reduce((acc, cur) => {
      if (cur.startsWith('sql\n')) {
        return [...acc, { isCode: true, text: cur.substring(4) }];
      } else {
        return [...acc, { isCode: false, text: cur.replaceAll('\n\n', '\n') }];
      }
    }, []);

    return contentArr;
  };

  const getHighlightedText = (text) => {
    const regexWithDelimiter = /(`[^`]*`)/g;
    const regexWithoutDelimiter = /`([^`]*)`/g;

    const splitText = text.split(regexWithDelimiter);
    return (
      <div css={'white-space: pre-line;'}>
        {splitText.map((segment, index) => {
          if (regexWithDelimiter.test(segment)) {
            return (
              <span key={index} className={styles.codeInExplanation}>
                {segment.replace(regexWithoutDelimiter, '$1')}
              </span>
            );
          } else {
            return <span key={index}>{segment}</span>;
          }
        })}
      </div>
    );
  };

  const getSqlCodeHeight = (code) => {
    const lineCharLen = 55;
    const codeLines = code?.split('\n') ?? [];
    const lineLen = codeLines.reduce((acc, cur) => {
      if (cur === '') {
        return acc + 1;
      }
      const wrapCount = Math.ceil(cur.length / lineCharLen);
      return acc + wrapCount;
    }, 0);

    return lineLen * 18;
  };

  const sqlCodeHeight = useMemo(() => {
    const lineCharLen = 55;
    const codeLines = sqlRes
      ?.filter((item) => item.isCode)
      ?.reduce((acc, cur) => {
        const lines = cur.text?.split('\n') ?? [];
        return [...acc, ...lines];
      }, []);
    const lineLen = codeLines.reduce((acc, cur) => {
      if (cur === '') {
        return acc + 1;
      }
      const wrapCount = Math.ceil(cur.length / lineCharLen);
      return acc + wrapCount;
    }, 0);

    return lineLen * 18;
  }, [sqlRes]);

  const sqlTextHeight = useMemo(() => {
    const lineCharLen = 55;
    const textLines = sqlRes
      ?.filter((item) => !item.isCode)
      ?.reduce((acc, cur) => {
        const lines = cur.text?.split('\n') ?? [];
        return [...acc, ...lines];
      }, []);
    const lineLen = textLines.reduce((acc, cur) => {
      if (cur === '') {
        return acc + 1;
      }
      const wrapCount = Math.ceil(cur.length / lineCharLen);
      return acc + wrapCount;
    }, 0);

    return lineLen < 2 ? 40 : lineLen * 22.5;
  }, [sqlRes]);

  const onCopyCode = (code) => {
    if (!Utils.isNullOrEmpty(code)) {
      UtilsWeb.copyToClipboard(code);
      REActions.addNotification('Copied to clipboard!');
    }
  };

  const onKeyDownPrompt = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onGenerateSQL();
    }
  };

  useEffect(() => {
    if (featureGroupEditOne) {
      let g1: any = featureGroupEditOne;
      if (g1) {
        refSqlLast.current = {};

        let sql1 = g1.sql ?? g1.functionSourceCode;
        refSqlLast.current.sql = sql1;

        setTimeout(() => {
          cpuAndMemoryRef.current?.setCpuValue(g1?.cpuSize);
          cpuAndMemoryRef.current?.setMemoryValue(g1.memory);
        }, 0);

        let nestedPitCols = g1.features?.filter((c1) => c1?.columns != null || c1?.pointInTimeInfo != null);
        if (nestedPitCols != null && nestedPitCols.length > 0) {
          setHasNestedPitCols(true);
        }

        let value1: any = { tags: g1.tags, tableName: g1.tableName, description: g1.description };
        if (!isTemplate) {
          value1.sql = sql1;
        }

        if (useLang === FGLangType.Python) {
          value1.functionName = g1.pythonFunctionName || g1.functionName;
          value1.inputFeatureGroups = g1.sourceTables;

          refSqlLast.current.functionName = value1.functionName;
          refSqlLast.current.inputFeatureGroups = value1.inputFeatureGroups;
          refSqlLast.current.memoryGB = g1.memory;
          refSqlLast.current.cpuSize = g1.cpuSize;
        }

        refOriValues.current = value1;
        form.setFieldsValue(value1);
        setIsCurrentChanged(false);

        if (isTemplate) {
          let templateBindings = featureGroupEditOne?.templateBindings;
          if (_.isObject(templateBindings) && _.isEmpty(templateBindings)) {
            templateBindings = null;
          }
          let config1 = convertBEToConfig(featureGroupEditOne?.featureGroupTemplate?.templateVariables);

          let config2 = config1
            ?.map((c1) => {
              let res = c1 == null ? c1 : { ...c1 };

              if (res != null) {
                let f1 = templateBindings?.find((c2) => c2.name === c1.value);
                if (f1 == null) {
                  res.name = null;
                } else if (f1?.value != null) {
                  res.name = f1.value;
                }
              }

              return res;
            })
            ?.filter((v1) => v1 != null);
          setConfig(config2 ?? null);
        }
      }
    } else if (pythonFunctionName) {
      refSqlLast.current = {};
      let value1: any = {};
      if (useLang === FGLangType.Python) {
        value1.functionName = pythonFunctionName;
        value1.sql = pythonFunctionOne?.codeSource?.sourceCode ?? '';

        refSqlLast.current.sql = value1.sql;
        refSqlLast.current.functionName = value1.functionName;
      }

      refOriValues.current = value1;
      form.setFieldsValue(value1);
      setIsCurrentChanged(false);
    }
  }, [featureGroupEditOne, pythonFunctionName, pythonFunctionOne, useLang, isTemplate]);

  const onClickFiltersEditPreviewSQL = (e) => {
    setConfig((c1) => {
      let sql1 = !useTemplateId ? null : sqlUsed;

      let config1 = convertConfigToBE(c1);
      refEditorSql.current?.doProcessing(null, () => {
        return refEditorSql.current?.doPreviewTemplateSql(sql1, config1, useTemplateId);
      });

      return c1;
    });
  };

  const usedBeforeAndRemovedNames = useRef({});

  const onClickOpenNotebook = (e) => {
    e.preventDefault();
    Location.push('/' + PartsLink.python_functions_one + '/' + (projectId ?? '-') + '/' + encodeURIComponent(pythonFunctionName), undefined, 'notebookId=' + encodeURIComponent(pythonFunctionOne?.notebookId), false, true);
  };

  const onClickFiltersEditPreviewTemplate = (e) => {
    setConfig((c1) => {
      let sql1 = sqlUsed;

      let config1 = convertConfigToBE(c1);
      refEditorSql.current?.doProcessing(null, () => {
        return new Promise((resolve) => {
          REClient_.client_().previewFeatureGroupTemplateResolution(null, sql1, config1, null, true, (err, res) => {
            let r1 = res?.result?.resolvedSql;

            let err1 = res?.result?.sqlError ?? res?.sqlError;
            if (err1) {
              resolve(err1);
            } else {
              resolve(null);
              return refEditorSql.current?.doPreview(r1, (v1) => {
                if (v1) {
                  form?.setFieldsValue({ sql: v1 || '' });
                }
              });
            }
          });
        });
      });

      return c1;
    });
  };

  const onClickFiltersEditFormat = (e) => {
    refEditorSql.current?.doFormat();
  };

  const onClickFiltersEditPreview = (e) => {
    refEditorSql.current?.doPreview(undefined, (v1) => {
      if (v1) {
        form?.setFieldsValue({ sql: v1 || '' });
      }
    });
  };

  let popupContainerForMenu = (node) => document.getElementById('body2');

  const optionsFeatureGroups = useMemo(() => {
    return featuresGroupsList
      ?.filter((f1) => ['SQL', 'PYTHON'].includes(f1?.featureGroupSourceType?.toUpperCase()))
      ?.map((f1) => {
        return {
          label: f1.tableName ?? f1.name,
          value: f1.featureGroupId,
          data: f1,
        };
      });
  }, [featuresGroupsList]);

  const optionsFeatureGroupsTables = useMemo(() => {
    let list = projectId == null ? allFG : featuresGroupsList;

    if (props.isEditFeatureGroupId) {
      list = list?.filter((f1) => f1?.featureGroupId !== props.isEditFeatureGroupId);
    }

    return list?.map((f1) => {
      return {
        label: f1.tableName ?? f1.name,
        value: f1.tableName,
        data: f1,
      };
    });
  }, [featuresGroupsList, allFG, projectId, props.isEditFeatureGroupId]);

  const featureGroupSelectValue = useMemo(() => {
    return optionsFeatureGroups?.find((v1) => v1.value === props.isEditFeatureGroupId);
  }, [optionsFeatureGroups, props.isEditFeatureGroupId]);

  const onChangeFeatureGroup = (option1) => {
    setPreviewDataFilterSQL(null);

    Location.push('/' + PartsLink.feature_groups_edit + '/' + projectId + '/' + option1?.value);
  };

  const onChangeFunction = (option) => {
    StoreActions.describePythonFunction_(option.value);
    setPythonFunctionName(option.value);
  };

  const checkFormIsEqual = () => {
    setTimeout(() => {
      let vv = form?.getFieldsValue();
      let oriVV = refOriValues.current;

      const isEqual = (a, b) => {
        if (a === '') {
          a = null;
        }
        if (b === '') {
          b = null;
        }

        return a == b;
      };

      if (isEqual(vv?.tableName, oriVV?.tableName) && isEqual(vv?.sql, oriVV?.sql) && isEqual(vv?.description, oriVV?.description)) {
        setIsCurrentChanged(false);
      } else {
        setIsCurrentChanged(true);
      }
    }, 0);
  };

  const onChangeFormSql = (name, value) => {
    checkFormIsEqual();

    value = name;
    if (value) {
      let mm = value.match(/\{[^}]+\}/gi);
      if (mm == null && !_.isArray(mm)) {
        mm = [];
      }

      let res = [];
      mm.some((m1) => {
        m1 = m1.substring(1);
        m1 = m1.substring(0, m1.length - 1);
        res.push(normValueForTemplate(m1));
      });

      setConfig((cc) => {
        cc = [...(cc ?? [])];

        cc = cc.filter((c1) => {
          let r = res.map((s1) => s1?.toLowerCase()).includes(c1.value?.toLowerCase());
          if (!r) {
            usedBeforeAndRemovedNames.current[c1.value?.toLowerCase()] = c1.name;
          }
          return r;
        });

        [...(res ?? [])]?.some((s1) => {
          let c1 = cc.find((c2) => c2.value?.toLowerCase() === s1?.toLowerCase());
          if (c1 == null) {
            cc.push({ name: usedBeforeAndRemovedNames.current[s1?.toLowerCase()] || s1, value: s1, type: ETemplatesOneTypeDefault } as ITemplateConfigOne);
          }
        });

        return cc;
      });
    } else {
      setConfig([]);
    }
  };

  const onChangeForm = (name, value) => {
    if (useLang === FGLangType.Python) {
      return onChangeFormPython(name);
    }
    return onChangeFormSql(name, value);
  };

  const updateAddPythonPackageButton = () => {
    setTimeout(() => {
      const pythonPackageRequirements = form.getFieldValue('packageRequirements');
      setAddPythonPackageButtonDisabled(!pythonPackageRequirements?.[0]);
    }, 0);
  };
  const onFormChange = (...props) => {
    updateAddPythonPackageButton();
    checkFormIsEqual();
  };

  const debouncedRefreshPythonFunctionTemplate = _.debounce((functionName, pythonFunctionBindings) => refreshPythonFunctionTemplate(functionName, pythonFunctionBindings), 500);

  useEffect(() => {
    const pythonFunctionBindings = getPythonFunctionBindings();
    if (useLang === FGLangType.Python && newFunctionNameValue && pythonFunctionType === 'new' && !props.isEditFeatureGroupId) {
      const validPythonArgs = getValidPythonArgs(pythonFunctionBindings);

      debouncedRefreshPythonFunctionTemplate(newFunctionNameValue, validPythonArgs);
    }
  }, [newFunctionNameValue]);

  useEffect(() => {
    projectDatasets.memDatasetsByProjectId(true, undefined, projectId);
  }, [projectDatasetsParam, projectId]);
  const datasetsList = useMemo(() => {
    return projectDatasets.memDatasetsByProjectId(false, undefined, projectId);
  }, [projectDatasetsParam, projectId]);

  const optionsFGStreaming = useMemo(() => {
    return optionsFeatureGroups
      ?.map((f1) => {
        let fg1 = f1.data;
        if (datasetsList != null && fg1 != null) {
          if (datasetsList.find((d1) => d1?.dataset?.featureGroupTableName === fg1?.tableName)?.streaming === true) {
            return f1;
          } else {
            return null;
          }
        }

        return f1;
      })
      ?.filter((v1) => v1 != null);
  }, [optionsFeatureGroups, datasetsList]);

  const optionsLock = useMemo(() => {
    return [
      {
        label: 'All Organization',
        value: FGLockType.Org,
      },
      {
        label: 'My Groups',
        value: FGLockType.MyGroups,
      },
      {
        label: 'Only Myself',
        value: FGLockType.Lock,
      },
    ];
  }, []);

  const optionsFGNonStreaming = useMemo(() => {
    return optionsFeatureGroups
      ?.map((f1) => {
        let fg1 = f1.data;
        if (datasetsList != null && fg1 != null) {
          if (datasetsList.find((d1) => d1?.dataset?.featureGroupTableName === fg1?.tableName)?.streaming !== true) {
            return f1;
          } else {
            return null;
          }
        }

        return f1;
      })
      ?.filter((v1) => v1 != null);
  }, [optionsFeatureGroups, datasetsList]);

  const fromFeatureGroupUsed = useRef(false);
  const fromFeatureGroup = paramsProp?.get('fromFeatureGroup');
  useEffect(() => {
    if (fromFeatureGroupUsed.current) {
      return;
    }

    if (!Utils.isNullOrEmpty(fromFeatureGroup)) {
      if (optionsFGNonStreaming != null) {
        fromFeatureGroupUsed.current = true;

        let r1 = optionsFGNonStreaming?.find((o1) => o1.value === fromFeatureGroup);
        if (r1 != null) {
          form?.setFieldsValue({ sourceFG: r1 });
        }
      }
    }
  }, [fromFeatureGroup, optionsFGNonStreaming]);

  const fromStreamingFeatureGroupUsed = useRef(false);
  const fromStreamingFeatureGroup = paramsProp?.get('fromStreamingFeatureGroup');
  useEffect(() => {
    if (fromStreamingFeatureGroupUsed.current) {
      return;
    }

    if (!Utils.isNullOrEmpty(fromStreamingFeatureGroup)) {
      if (optionsFGStreaming != null) {
        fromStreamingFeatureGroupUsed.current = true;

        let r1 = optionsFGStreaming?.find((o1) => o1.value === fromStreamingFeatureGroup);
        if (r1 != null) {
          form?.setFieldsValue({ streamingFG: r1 });
        }
      }
    }
  }, [fromStreamingFeatureGroup, optionsFGStreaming]);

  const onChangeConfig = (v1) => {
    setConfig(v1);
  };

  const sampleCodePython = useMemo(() => {
    return (
      <div
        css={`
          text-align: left;
        `}
      >
        <div>def transform_data(input_fg_df):</div>
        <div
          css={`
            margin-left: 20px;
          `}
        >
          {"input_fg_df['full_street_address'] = input_fg_df[['street_number', 'street_name', 'apt_number']].agg(' '.join, axis=1)"}
        </div>
        <div
          css={`
            margin-left: 20px;
          `}
        >
          return input_fg_df
        </div>
      </div>
    );
  }, []);

  const previewRef = useRef({
    previewData: previewDataFilterSQL,
    setPreviewData: (newValue) => {
      previewRef.current = { ...previewRef.current };
      previewRef.current.previewData = newValue;
      setPreviewDataFilterSQL(newValue);
    },
  });

  const optionsTags = useMemo(() => {
    let tagsDict: any = {};
    featuresGroupsList?.some((f1) => {
      if (f1?.tags != null && _.isArray(f1?.tags)) {
        f1?.tags?.some((tag1) => {
          tagsDict[tag1] = true;
        });
      }
    });
    return Object.keys(tagsDict ?? {}).map((s1) => ({ label: s1, value: s1 }));
  }, [featuresGroupsList]);

  const onChangePythonFunctionType = (e) => {
    setPythonFunctionType(e.target.value);
    if (e.target.value === 'new') {
      setPythonFunctionName(null);
      setPythonConfig([]);
      form?.setFieldValue('sql', '');
      form?.setFieldValue('functionName', '');
    }
  };

  const checkIsFeatureGroupNameUsed = async (name: string) => {
    try {
      const response = await REClient_.promises_()._isFeatureGroupNameUsed(name);
      if (!response?.success || response?.result) {
        throw new Error(`Feature Group "${name}" already exists`);
      }
    } catch (error) {
      return Promise.reject(error);
    }
    return Promise.resolve();
  };
  const checkIsFeatureGroupNameUsedDebounced = debounce(checkIsFeatureGroupNameUsed, 240);

  const uniqueFeatureGroupNameValidator = () => ({
    validator(_: any, name: string) {
      if (!name) return Promise.resolve();
      return checkIsFeatureGroupNameUsedDebounced(name);
    },
  });

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

  const pythonArgsEditor = (
    <div
      css={`
        flex: 1;
      `}
    >
      <Form.Item
        style={{ marginBottom: '10px' }}
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
        <PythonFunctionConfigEditor
          featureGroupId={props.isEditFeatureGroupId}
          config={pythonConfig}
          onChange={onChangePythonConfig}
          allowAdd={pythonFunctionType === 'new' && !props.isEditFeatureGroupId && !pythonFunctionNameUsed}
          refreshTemplateOnArgChange={refreshTemplateOnArgChange}
        />
      </div>
    </div>
  );

  const editorContainer = (
    <Form.Item
      name={'sql'}
      rules={[{ required: true, message: (useLang === FGLangType.Python ? 'Code' : 'SQL') + ' required!' }]}
      style={{ marginBottom: 0 }}
      label={
        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
          {useLang === FGLangType.Python ? (pythonFunctionType === 'new' && !props.isEditFeatureGroupId && !pythonFunctionNameUsed ? 'Sample Code Preview' : 'Python Function Code') : 'SQL'}
          {isTemplate ? ` From Template` : ''}:<HelpIcon id={`fg_add_code${isTemplate ? '_template' : ''}`} style={{ marginLeft: '4px' }} />
        </span>
      }
    >
      <EditorElemForFeatureGroup
        lineNumbers={true}
        readSure={(!fullEdit && isTemplate) || (!props.isEditFeatureGroupId && useLang === FGLangType.Python)}
        onlyThisFeatureGroup={isTemplate}
        readonly={(!fullEdit && isTemplate) || (!props.isEditFeatureGroupId && useLang === FGLangType.Python)}
        allowResizeHeight={'fg_add_editor_hh'}
        lang={useLang === FGLangType.Python ? 'python' : null}
        onChange={onChangeForm}
        projectId={projectId}
        refEditor={refEditorSql}
        validateFeatureGroupId={props.isEditFeatureGroupId}
        validateFeatureTableName={featureGroupEditOne?.tableName}
      />
    </Form.Item>
  );

  return (
    <div style={{ margin: '0 30px' }}>
      <div style={{ margin: '30px auto', maxWidth: '1200px', color: Utils.colorA(1) }}>
        {props.isEditFeatureGroupId && projectId != null && (
          <div>
            <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
              <span>
                Feature Group
                <HelpIcon id={'fg_edit_sql'} style={{ marginLeft: '4px' }} />
              </span>
              <span style={{ display: projectId == null ? 'none' : 'inline-block', verticalAlign: 'top', paddingTop: '2px', marginLeft: '16px', width: '440px', fontSize: '12px' }}>
                <SelectExt isDisabled={isOnlyTags || isCurrentChanged} value={featureGroupSelectValue} options={optionsFeatureGroups} onChange={onChangeFeatureGroup} isSearchable={true} menuPortalTarget={popupContainerForMenu(null)} />
              </span>
            </div>
          </div>
        )}
        <EditorElemPreview.Provider value={previewRef.current}>
          <Card style={{ boxShadow: '0 0 4px rgba(0,0,0,0.2)', border: '1px solid ' + Utils.colorA(0.5), backgroundColor: Utils.colorA(0.04), borderRadius: '5px' }} className={sd.grayPanel}>
            {/*// @ts-ignore*/}
            <Spin spinning={isProcessing} size={'large'}>
              {
                <FormExt layout={'vertical'} form={form} onChange={onFormChange} onFinish={handleSubmit} initialValues={{ lockType: optionsLock?.find((v1) => v1.value === FGLockType.Org), datasetType: datasetTypeNull.current }}>
                  {pythonPromptAdvElem != null && <span style={{ float: 'right' }}>{pythonPromptAdvElem}</span>}

                  {!props.isEditFeatureGroupId && useLang !== FGLangType.Streaming && (
                    <Form.Item
                      name={'tableName'}
                      rules={[{ required: true, message: 'Table Name required!' }, uniqueFeatureGroupNameValidator]}
                      style={{ marginBottom: '10px' }}
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          {'Table Name'}:<HelpIcon id={'fg_add_python_tablename'} style={{ marginLeft: 4 }} />
                        </span>
                      }
                    >
                      <Input placeholder="" autoComplete={'off'} />
                    </Form.Item>
                  )}

                  {!!props.isEditFeatureGroupId && (
                    <Form.Item
                      name={'tableName'}
                      rules={[{ required: true, message: 'Table Name required!' }]}
                      style={{ marginBottom: '10px' }}
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          {'Table Name'}:<HelpIcon id={'fg_add_python_tablename'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <Input
                        css={`
                          &.ant-input.ant-input {
                            background-color: #424242 !important;
                          }
                        `}
                        disabled={true}
                        placeholder=""
                        autoComplete={'off'}
                      />
                    </Form.Item>
                  )}

                  {useLang !== FGLangType.Streaming && !isOnlyTags && (
                    <Form.Item
                      name={'description'}
                      style={{ marginBottom: '10px' }}
                      hasFeedback
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Description:
                          <HelpIcon id={'fg_add_python_desc'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <Input placeholder="" autoComplete={'off'} />
                    </Form.Item>
                  )}

                  {useLang !== FGLangType.Streaming && (
                    <div
                      css={`
                        & #tags {
                          color: white;
                        }
                      `}
                    >
                      <Form.Item
                        name={'tags'}
                        style={{ marginBottom: '10px' }}
                        hasFeedback
                        label={
                          <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                            Tags:
                            <HelpIcon id={'fg_add_python_tags'} style={{ marginLeft: '4px' }} />
                          </span>
                        }
                      >
                        <SelectReactExt placeholder={'Enter keywords/tags to describe this feature group'} allowCreate allowReOrder mode={'multiple'} allowClear options={optionsTags} />
                      </Form.Item>
                    </div>
                  )}

                  {useLang !== FGLangType.Streaming && !props.isEditFeatureGroupId && projectId != null && (
                    <Form.Item
                      name={'datasetType'}
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Feature Group Type:
                          <HelpIcon id={'datasettypeadd'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <SelectExt style={{ fontWeight: 400, color: Utils.colorA(1) }} options={optionsDatasetType} />
                    </Form.Item>
                  )}

                  {useLang !== FGLangType.Streaming && !props.isEditFeatureGroupId && (
                    <Form.Item
                      rules={[{ required: true, message: 'Required!' }]}
                      name={'lockType'}
                      style={{ marginBottom: '10px' }}
                      hasFeedback
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Who can modify this Feature Group?
                          <HelpIcon id={'fgadd_whomodify'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <SelectExt options={optionsLock} />
                    </Form.Item>
                  )}

                  {!props.isEditFeatureGroupId && !pythonFunctionNameUsed && useLang === FGLangType.Python && (
                    <div>
                      <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                        <span style={{ color: '#ff4d4f', marginRight: '4px', fontSize: '14px', fontFamily: 'SimSun, sans-serif' }}>*</span>
                        Python Function Name:
                        <HelpIcon id={'python_func_list_title'} style={{ marginLeft: '4px' }} />
                        {fromFeatureGroupList && (
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
                      {pythonFunctionType === 'new' && (
                        <Form.Item rules={[{ required: true, message: 'Required!' }, uniqueFunctionNameValidator]} name={'functionName'} style={{ margin: '10px 0' }} hasFeedback>
                          <Input disabled={!!props.isEditFeatureGroupId} placeholder="" autoComplete={'off'} />
                        </Form.Item>
                      )}
                      {pythonFunctionType === 'exist' && (
                        <Form.Item rules={[{ required: true, message: 'Required!' }]} name={'selectedFunctionName'} style={{ margin: '10px 0' }} hasFeedback>
                          <SelectExt options={pythonFunctionOptions ?? []} onChange={onChangeFunction} />
                        </Form.Item>
                      )}
                    </div>
                  )}

                  {useLang === FGLangType.Python && (
                    <div className={styles.pythonContainer}>
                      <CpuAndMemoryOptions fillWidth ref={cpuAndMemoryRef} form={form} isForm name={'PythonFG'} helpidPrefix={'fg_add_python'} />
                      <div className={styles.packages}>
                        <span className={styles.packagesLbl} style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Python Package Requirements: <HelpIcon id={'fg_add_python_package_requirements'} />
                        </span>
                        <Form.List name="packageRequirements">
                          {(fields, { add, remove }) => {
                            const onAdd = (e) => {
                              e?.preventDefault?.();
                              const newValue = form.getFieldValue('packageRequirements')?.[0];
                              if (!newValue) {
                                return;
                              }
                              add('', 0);
                              setAddPythonPackageButtonDisabled(true);
                            };
                            return (
                              <>
                                {fields.map((field) => {
                                  const isFirst = !field?.name;
                                  return (
                                    <div className={styles.formItemContainer} key={field.key}>
                                      {!isFirst && <span className={styles.greyBulletPoint}></span>}
                                      <Form.Item hasFeedback {...field} className={classNames(styles.formItemPackage, !isFirst && styles.label)}>
                                        {isFirst ? <Input onPressEnter={(e) => onAdd(e)} disabled={!isFirst} /> : <FormItemPackage />}
                                      </Form.Item>
                                      {isFirst ? (
                                        <Button type="primary" disabled={addPythonPackageButtonDisabled} onClick={onAdd}>
                                          Add
                                        </Button>
                                      ) : (
                                        <FontAwesomeIcon
                                          icon={require('@fortawesome/pro-regular-svg-icons/faTrash').faTrash}
                                          color="red"
                                          style={{ margin: '0 8px', cursor: 'pointer' }}
                                          transform={{ size: 13, x: 0, y: 0 }}
                                          onClick={isFirst ? onAdd : () => remove(field.name)}
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </>
                            );
                          }}
                        </Form.List>
                      </div>
                    </div>
                  )}

                  {useLang === FGLangType.Streaming && (
                    <Form.Item
                      rules={[{ required: true, message: 'Required!' }]}
                      name={'sourceFG'}
                      style={{ marginBottom: '10px' }}
                      hasFeedback
                      label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Batch Feature Group:</span>}
                    >
                      <SelectExt options={optionsFGNonStreaming} />
                    </Form.Item>
                  )}

                  {useLang === FGLangType.Streaming && (
                    <Form.Item
                      rules={[{ required: true, message: 'Required!' }]}
                      name={'streamingFG'}
                      style={{ marginBottom: '10px' }}
                      hasFeedback
                      label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Streaming Feature Group:</span>}
                    >
                      <SelectExt options={optionsFGStreaming} />
                    </Form.Item>
                  )}

                  {useLang === FGLangType.Streaming && (
                    <Form.Item
                      valuePropName={'checked'}
                      name={'skipMaterialize'}
                      style={{ marginBottom: '10px' }}
                      hasFeedback
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Skip Streaming Snapshot: <HelpIcon id={'fgs_skip_snapshot'} style={{ marginLeft: '4px' }} />
                        </span>
                      }
                    >
                      <Checkbox>
                        <span
                          css={`
                            color: white;
                            opacity: 0.8;
                          `}
                        ></span>
                      </Checkbox>
                    </Form.Item>
                  )}

                  {useLang !== FGLangType.Streaming && !hideTemplate && !isOnlyTags && (
                    <div>
                      <div
                        css={`
                          display: flex;
                          position: relative;
                        `}
                      >
                        {isTemplate && (
                          <div
                            css={`
                              width: 560px;
                              position: relative;
                            `}
                          >
                            <Form.Item
                              style={{ marginBottom: 0 }}
                              label={
                                <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                                  {'Config'}:<HelpIcon id={`fg_add_config`} style={{ marginLeft: '4px' }} />
                                </span>
                              }
                            ></Form.Item>
                            <div
                              css={`
                                margin-top: -20px;
                                margin-right: 10px;
                                position: relative;
                                margin-right: 10px;
                                margin-bottom: 10px;
                                width: 100%;
                              `}
                            >
                              <TemplateConfigEditor
                                sqlText={sqlUsed}
                                dropdownMaxChars={20}
                                isSystemTemplate={templateOne?.isSystemTemplate === true}
                                showDefaultWhenNullName
                                isRelative
                                isInlineEdit={useTemplateId != null && !fullEdit}
                                editMode={!fullEdit}
                                config={config}
                                configOri={configOri}
                                onChange={onChangeConfig}
                              />
                            </div>
                          </div>
                        )}
                        <div
                          css={`
                            flex: 1;
                          `}
                        >
                          {(props.isEditFeatureGroupId || pythonFunctionName) && !fromFeatureGroupList && useLang === FGLangType.Python && (
                            <Form.Item
                              name={'functionName'}
                              rules={[{ required: true, message: 'Required' }]}
                              style={{ marginBottom: '10px' }}
                              label={
                                <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                                  Python Function:
                                  <HelpIcon id={'python_func_list_title'} style={{ marginLeft: '4px' }} />
                                </span>
                              }
                            >
                              <Row gutter={20}>
                                <Col flex="auto">
                                  <Form.Item name={'functionName'} rules={[{ required: true, message: 'Required' }]} noStyle>
                                    <Input
                                      css={`
                                        &.ant-input.ant-input-disabled {
                                          background-color: #424242 !important;
                                        }
                                      `}
                                      disabled={!!pythonFunctionOne}
                                      placeholder=""
                                      autoComplete={'off'}
                                    />
                                  </Form.Item>
                                </Col>
                                {pythonFunctionOne && (
                                  <Col>
                                    <Button type="primary" className="login-form-button" onClick={onClickOpenNotebook}>
                                      Open In Notebook
                                    </Button>
                                  </Col>
                                )}
                              </Row>
                            </Form.Item>
                          )}
                          {!(pythonFunctionOne && pythonConfig) && (pythonFunctionName || pythonFunctionType === 'exist') && useLang === FGLangType.Python && (
                            <Form.Item
                              name={'inputFeatureGroups'}
                              style={{ marginBottom: '10px' }}
                              hasFeedback
                              label={
                                <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                                  Python Function Arguments:
                                  <HelpIcon id={'python_func_bindings'} style={{ marginLeft: '4px' }} />
                                  {isAllFGRefreshing == true && <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faSync').faSync} transform={{ size: 15, x: 0, y: 0 }} spin style={{ color: 'white', marginLeft: '7px' }} />}
                                </span>
                              }
                            >
                              <SelectReactExt allowReOrder options={optionsFeatureGroupsTables} /*mode={'multiple'}*/ allowClear />
                            </Form.Item>
                          )}
                          {pythonFunctionType === 'new' && useLang === FGLangType.Python && !props.isEditFeatureGroupId && !pythonFunctionNameUsed && (
                            <div className={styles.newpyContainer}>
                              {pythonArgsEditor}
                              {editorContainer}
                            </div>
                          )}
                          {(!!props.isEditFeatureGroupId || useLang !== FGLangType.Python || pythonFunctionOne) && (
                            <div
                              css={`
                                display: flex;
                                ${!pythonFunctionOne ? 'flex-direction: column;' : ''}
                              `}
                            >
                              {useLang === FGLangType.Python && pythonArgsEditor}
                              <div
                                css={`
                                  flex: 1;
                                `}
                              >
                                {!Constants.disableAiFunctionalities && useLang === FGLangType.SQL && (
                                  <div>
                                    <div css={'color: white;'}>
                                      <div>
                                        Describe what you want from the data. <HelpIcon id={'fg_sql_prompt'} style={{ marginLeft: '4px' }} />
                                      </div>
                                    </div>
                                    <div
                                      css={`
                                        display: flex;
                                        gap: 10px;
                                        align-items: center;
                                        margin: 10px 0;
                                        height: ${sqlCodeHeight + sqlTextHeight + 70}px;
                                      `}
                                    >
                                      <div css={'flex: 1; max-width: 50%;'}>
                                        <EditorElemForFeatureGroup
                                          readonly={false}
                                          lang={''}
                                          hideExpandFull
                                          projectId={projectId}
                                          height={sqlCodeHeight + sqlTextHeight + 45}
                                          value={promptText}
                                          onChange={(name, value) => {
                                            setPromptText(name);
                                          }}
                                        />
                                        {promptText === '' && <div css={'position: absolute; left: 5px; top: 30px; color: #a0a0a0'}>Enter text here...</div>}
                                        <div
                                          css={`
                                            color: rgba(255, 255, 255, 0.4);
                                            height: 25px;
                                            background-color: #303030;
                                            margin-top: 0px;
                                            font-size: 13px;
                                            text-align: center;
                                          `}
                                        >
                                          (Press Ctrl+Space to autocomplete name of columns and datasets)
                                        </div>
                                      </div>
                                      <Button disabled={isRefreshGenerateSQL || promptText === ''} type="primary" onClick={onGenerateSQL} ghost css={'height: auto;'}>
                                        {isRefreshGenerateSQL ? (
                                          <div css={'display: flex; flex-direction: column; align-items: center;'}>
                                            <div>Generating...</div>
                                            <div>
                                              <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} className={styles.spinner} />
                                            </div>
                                          </div>
                                        ) : (
                                          <div css={'display: flex; flex-direction: column; align-items: center;'}>
                                            <div>Auto-generate</div>
                                            <div>
                                              SQL <FontAwesomeIcon color="yellow" icon={require('@fortawesome/pro-solid-svg-icons/faSparkles').faSparkles} transform={{ size: 15, x: 0, y: 0 }} />
                                            </div>
                                          </div>
                                        )}
                                      </Button>
                                      <div css={'flex: 1; height: 100%; background: #323C44; color: white; padding: 10px; border: solid 1px grey;'}>
                                        {sqlRes?.length > 0 &&
                                          sqlRes.map((item) =>
                                            item.isCode ? (
                                              <div css={''}>
                                                <div
                                                  css={`
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: space-between;
                                                    height: 30px;
                                                    background: #343440;
                                                    padding: 0 10px;
                                                  `}
                                                >
                                                  <span>SQL</span>
                                                  <div
                                                    css={`
                                                      display: flex;
                                                      align-items: center;
                                                      gap: 10px;
                                                    `}
                                                    onClick={() => {
                                                      onCopyCode(item.text);
                                                    }}
                                                  >
                                                    <span>Copy code</span>
                                                    <CopyOutlined />
                                                  </div>
                                                </div>
                                                <EditorElem lineNumbers={true} lang="sql" hideExpandFull validateOnCall readonly={true} value={item.text} height={getSqlCodeHeight(item?.text)} />
                                              </div>
                                            ) : (
                                              <div css={'font-size: 15px;'}>{getHighlightedText(item.text)}</div>
                                            ),
                                          )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {editorContainer}
                              </div>
                            </div>
                          )}

                          {(!!props.isEditFeatureGroupId || useLang !== FGLangType.Python) && !isTemplate && !Utils.isNullOrEmpty(sample1) && (
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
                              {!props.isEditFeatureGroupId && (
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
                              {!props.isEditFeatureGroupId && useLang === FGLangType.Python && (
                                <div
                                  css={`
                                    color: rgba(255, 255, 255, 0.7);
                                    font-size: 13px;
                                    text-align: center;
                                  `}
                                >
                                  {sampleCodePython}
                                </div>
                              )}
                              {!props.isEditFeatureGroupId && ![FGLangType.Python, FGLangType.Streaming].includes(useLang) && (
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
                                  margin-top: ${!props.isEditFeatureGroupId ? 5 : 0}px;
                                  font-size: 13px;
                                  text-align: center;
                                `}
                              >
                                (Press Ctrl+Space to autocomplete name of columns and datasets)
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>
                  <div
                    style={{ textAlign: 'center' }}
                    css={`
                      position: relative;
                    `}
                  >
                    {!hideTemplate && !hasNestedPitCols && !isOnlyTags && [FGLangType.SQL].includes(useLang) && props.isEditFeatureGroupId && !useTemplateId && (
                      <div
                        css={`
                          position: absolute;
                          left: 0;
                          top: 10px;
                          bottom: 0;
                          display: flex;
                          align-items: center;
                        `}
                      >
                        <Link to={['/' + PartsLink.feature_groups_template_add + '/' + (projectId ?? '-') + '/' + props.isEditFeatureGroupId, 'featureGroupId=' + encodeURIComponent(props.isEditFeatureGroupId)]} showAsLinkBlue usePointer>
                          Create Template
                        </Link>
                      </div>
                    )}

                    {!hideTemplate && !isTemplate && !isOnlyTags && Constants.flags.show_format_sql && ![FGLangType.Python, FGLangType.Streaming].includes(useLang) && (
                      <Button
                        disabled={isRefreshingEditorFilter}
                        type={'default'}
                        ghost
                        onClick={onClickFiltersEditFormat}
                        css={`
                          margin-right: 10px;
                        `}
                      >
                        Format SQL
                      </Button>
                    )}
                    {!hideTemplate && isTemplate && !isOnlyTags && ![FGLangType.Python, FGLangType.Streaming].includes(useLang) && (
                      <Button
                        disabled={isRefreshingEditorFilter}
                        type={'default'}
                        ghost
                        onClick={onClickFiltersEditPreviewSQL}
                        css={`
                          margin-right: 10px;
                        `}
                      >
                        Preview SQL
                      </Button>
                    )}
                    {!hideTemplate && !isOnlyTags && ![FGLangType.Python, FGLangType.Streaming].includes(useLang) && (
                      <Button
                        disabled={isRefreshingEditorFilter}
                        type={'default'}
                        ghost
                        onClick={isTemplate ? onClickFiltersEditPreviewTemplate : onClickFiltersEditPreview}
                        css={`
                          margin-right: 10px;
                        `}
                      >
                        Preview
                      </Button>
                    )}
                    <Button disabled={isRefreshingEditorFilter} loading={isRefreshingEditorFilter} type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: '16px' }}>
                      {isOnlyTags
                        ? 'Save'
                        : useLang === FGLangType.Streaming
                        ? 'Merge Streaming and Batch'
                        : props.isEditFeatureGroupId
                        ? `Save Changes to Feature Group${fullEdit ? ' and Template' : ''}`
                        : useLang === FGLangType.Python && pythonFunctionType === 'new' && !props.isEditFeatureGroupId && !pythonFunctionNameUsed
                        ? 'Proceed to Notebook'
                        : 'Add New Feature Group'}
                    </Button>
                  </div>
                </FormExt>
              }
            </Spin>
          </Card>

          {!hideTemplate && !isOnlyTags && <EditorElemPreviewGrid projectId={projectId} featureGroupId={props.isEditFeatureGroupId} />}
        </EditorElemPreview.Provider>

        {/*<div style={{ marginTop: '40px', textAlign: 'center', }}>*/}
        {/*  {useCase1!=null && <HelpBox isBig={true} name={'Need more help adding dataset with appropriate schema?'} subtitle={'Refer to'} subtitle2={'Use-case specific schema'} linkTo={'/help/useCases/'+useCase1+'/datasets'} />}*/}
        {/*</div>*/}
      </div>
    </div>
  );
});

export default FeatureGroupsAdd;
