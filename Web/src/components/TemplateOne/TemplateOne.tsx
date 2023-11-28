import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Checkbox from 'antd/lib/checkbox';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Spin from 'antd/lib/spin';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import SplitPane from 'react-split-pane';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useFeatureGroup, useFeatureGroupFromProject, useProject, useTemplate, useTemplateList } from '../../api/REUses';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import featureGroups from '../../stores/reducers/featureGroups';
import { ITemplateConfig, ITemplateConfigOne, convertBEToConfig, convertConfigToBE } from '../../stores/reducers/templates';
import { memUseCasesSchemasInfo } from '../../stores/reducers/useCases';
import { EditorElemPreview, EditorElemPreviewGrid } from '../EditorElem/EditorElem';
import EditorElemForFeatureGroup from '../EditorElemForFeatureGroup/EditorElemForFeatureGroup';
import { FGLockType } from '../FeatureGroups/FGLangType';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import SelectExt from '../SelectExt/SelectExt';
import SelectReactExt from '../SelectReactExt/SelectReactExt';
import TemplateConfigEditor, { toSpansFromConfig } from '../TemplateConfigEditor/TemplateConfigEditor';

const s = require('./TemplateOne.module.css');
const sd = require('../antdUseDark.module.css');

interface ITemplateOneProps {
  isAttach?: boolean;
}

export const normValueForTemplate = (value) => {
  if (value != null) {
    value = _.trim(value);
    value = value.replace(/ /, '');
  }
  return value;
};

export const createRegExForValueTemplate = (value, useAsTemplate = true) => {
  return new RegExp(`${useAsTemplate ? '\\{[ ]*' : '\\b'}` + Utils.escapeRegex(_.trim(value || '')) + `${useAsTemplate ? '[ ]*\\}' : '\\b'}`, 'gi');
};

const TemplateOne = React.memo((props: PropsWithChildren<ITemplateOneProps>) => {
  const { paramsProp, authUser, useCasesParam, featureGroupsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    useCasesParam: state.useCases,
    featureGroupsParam: state.featureGroups,
  }));

  let projectId = paramsProp?.get('projectId');
  if (projectId === '' || projectId === '-') {
    projectId = null;
  }

  let featureGroupTemplateId = paramsProp?.get('featureGroupTemplateId');
  if (featureGroupTemplateId === '' || featureGroupTemplateId === '-') {
    featureGroupTemplateId = null;
  }

  let useTemplateId = paramsProp?.get('useTemplateId') ?? null;
  if (useTemplateId === '') {
    useTemplateId = null;
  }

  let featureGroupId = paramsProp?.get('featureGroupId');
  if (featureGroupId === '' || featureGroupId === '-') {
    featureGroupId = null;
  }

  let isAttach = paramsProp?.get('isAttach') === '1';
  let isEdit = false;
  if (paramsProp?.get('isEdit') === '1') {
    isEdit = true;
  }

  let fullEdit = paramsProp?.get('fullEdit') === '1';

  const [form] = Form.useForm();
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const refEditorSql = useRef(null);
  const [previewDataFilterSQL, setPreviewDataFilterSQL] = useState(null);
  const [isRefreshingEditorFilter, setIsRefreshingEditorFilter] = useState(false);
  const [config, setConfig] = useState(null as ITemplateConfig);
  const [configOri, setConfigOri] = useState(null as ITemplateConfig);
  const [sql, setSql] = useState('');
  const [isAnyErrorConfig, setIsAnyErrorConfig] = useState(false);
  const [detectedVarsUnused, setDetectedVarsUnused] = useState(null);
  const [detectedVars, setDetectedVars] = useState(null);
  const [defaultNewName, setDefaultNewName] = useState('');

  let canUseTemplateId = !Utils.isNullOrEmpty(featureGroupTemplateId);

  const sqlUsed = form?.getFieldValue('sql');

  //
  let camTemplateIdFromForm = false;
  let tId = form?.getFieldValue('template')?.value;
  if (!featureGroupTemplateId && tId) {
    camTemplateIdFromForm = true;
    featureGroupTemplateId = tId;
  }
  if (!featureGroupTemplateId && useTemplateId) {
    featureGroupTemplateId = useTemplateId;
  }
  if (useTemplateId) {
    canUseTemplateId = true;
  }

  //
  const projectFound = useProject(projectId);
  const templateOne = useTemplate(featureGroupTemplateId);
  const featureGroupOne = useFeatureGroup(null, featureGroupId);
  const isSystemTemplate = templateOne?.isSystemTemplate === true;

  const alreadySetDefault = useRef(false);
  useEffect(() => {
    alreadySetDefault.current = false;
  }, [featureGroupId]);

  const templateList = useTemplateList();
  const optionsTemplate = useMemo(() => {
    return templateList
      ?.map((t1) => ({ label: t1.name, value: t1.featureGroupTemplateId }))
      ?.sort((a, b) => {
        return (a.label || '').toLowerCase().localeCompare((b.label || '').toLowerCase());
      });
  }, [templateList]);

  useEffect(() => {
    if (featureGroupTemplateId && templateOne != null && (canUseTemplateId || camTemplateIdFromForm)) {
      let { templateSql, templateVariables } = templateOne ?? {};
      form?.setFieldsValue({ sql: templateSql || '' });
      onChangeFormSql(templateSql || '');

      if (isEdit) {
        let name1 = templateOne?.name;
        form?.setFieldsValue({ name: name1 || '', description: templateOne?.description ?? '' });
      }

      let config1 = convertBEToConfig(templateVariables);
      setConfigOri(config1 ?? null);

      let config2 = isEdit
        ? config1
        : config1?.map((c1) => {
            if (c1 == null) {
              return c1;
            }

            c1 = { ...c1 };
            c1.name = null;
            return c1;
          });
      setConfig(config2 ?? null);
    }
  }, [isEdit, templateOne, featureGroupTemplateId, canUseTemplateId, camTemplateIdFromForm]);

  useEffect(() => {
    if (isAttach) {
      return;
    }
    if (alreadySetDefault.current) {
      return;
    }

    let tn = featureGroupOne?.tableName;
    if (tn != null) {
      alreadySetDefault.current = true;

      form?.setFieldsValue({ tableName: tn });
      REClient_.client_().suggestFeatureGroupTemplateForFeatureGroup(featureGroupId, (err, res) => {
        let { templateSql, templateVariables } = res?.result ?? {};
        form?.setFieldsValue({ sql: templateSql || '' });
        onChangeFormSql(templateSql || '');

        let config1 = convertBEToConfig(templateVariables);
        setConfig(config1 ?? null);
        setConfigOri(config1 ?? null);
      });
    }
  }, [featureGroupOne, featureGroupId, isAttach]);

  const previewRef = useRef({
    previewData: previewDataFilterSQL,
    setPreviewData: (newValue) => {
      previewRef.current = { ...previewRef.current };
      previewRef.current.previewData = newValue;
      setPreviewDataFilterSQL(newValue);
    },
  });

  const handleSubmit = (values) => {
    const doWorkCreateTemplate = (c1, sql1) => {
      refEditorSql.current?.doProcessing(null, () => {
        return new Promise((resolve) => {
          const cb1 = (err, res) => {
            let err1 = res?.result?.sqlError ?? res?.sqlError;
            if (err || err1 || !res?.success) {
              if (err1) {
                resolve(err1);
              } else {
                REActions.addNotificationError(err || Constants.errorDefault);
                resolve(null);
              }
            } else {
              let featureGroupTemplateId = res?.result?.featureGroupTemplateId;
              if (projectId) {
                StoreActions.featureGroupsGetByProject_(projectId);
              }
              StoreActions.listTemplatesByProjectId_();
              StoreActions.featureGroupsDescribeReset_();

              resolve(null);

              // Location.push('/'+PartsLink.feature_groups_template_add+'/'+(projectId ?? '-'), undefined, 'isAttach=1&useTemplateId='+encodeURIComponent(featureGroupTemplateId));
              // if(isEdit) {
              //   Location.push('/' + PartsLink.templates_list);
              // } else {
              //   Location.push('/' + PartsLink.feature_groups_template + '/' + (projectId ?? '-') + '/' + featureGroupTemplateId);
              // }
              // Location.push('/' + PartsLink.feature_groups_template + '/' + (projectId ?? '-') + '/' + featureGroupTemplateId, undefined, 'fullEdit=1&isEdit=1');
              let fromFGId = paramsProp?.get('fromFeatureGroupId') || null;
              let fromProjectId = paramsProp?.get('fromProjectId') || null;
              if (fromFGId != null) {
                Location.push('/' + PartsLink.feature_group_detail + '/' + (fromProjectId || '-') + '/' + fromFGId);
              } else if (!Utils.isNullOrEmpty(featureGroupTemplateId)) {
                Location.push('/' + PartsLink.template_detail + '/' + featureGroupTemplateId);
              } else if (projectId != null) {
                Location.push('/' + PartsLink.feature_groups_template_list + '/' + projectId);
              } else {
                Location.push('/' + PartsLink.templates_list);
              }
            }
          };

          let shouldAttach = values.shouldAttach;

          if (isEdit) {
            REClient_.client_().updateFeatureGroupTemplate(featureGroupTemplateId, values.name, sql1, values.description, convertConfigToBE(c1), cb1);
          } else {
            REClient_.client_().createFeatureGroupTemplate(featureGroupId, values.name, sql1, convertConfigToBE(c1), values.description, shouldAttach, cb1);
          }
        });
      });
    };

    const doWorkAttach = (c1: ITemplateConfig, sql1: string) => {
      let featureGroupTemplateId = values.template?.value;
      if (Utils.isNullOrEmpty(featureGroupTemplateId)) {
        REActions.addNotificationError('Template Required!');
        return;
      }

      const cbCreate = (err, res) => {
        refEditorSql.current?.doProcessing(null, () => {
          return new Promise((resolve) => {
            if (err || !res?.success) {
              if (res?.sqlError) {
                resolve(res?.sqlError);
              } else {
                REActions.addNotificationError(err || Constants.errorDefault);
                resolve(null);
              }
            } else {
              let featureGroupId = res?.result?.featureGroupId;

              if (projectId == null) {
                StoreActions.featureGroupsDescribeReset_();
                Location.push('/' + PartsLink.feature_group_detail + '/-/' + featureGroupId);
                // Location.push('/' + PartsLink.featuregroups_list);
                resolve(null);
              } else {
                const datasetType = values.datasetType?.value;
                REClient_.client_().attachFeatureGroupToProject(featureGroupId, projectId, datasetType, (errA, resA) => {
                  if (errA || !resA?.success) {
                    resolve(errA || Constants.errorDefault);
                    // REActions.addNotificationError(errA || Constants.errorDefault);
                  } else {
                    StoreActions.featureGroupsDescribeReset_();
                    StoreActions.getProjectDatasets_(projectId, (res, ids) => {
                      StoreActions.listDatasets_(ids);
                    });
                    StoreActions.featureGroupsGetByProject_(projectId, (list) => {
                      list?.some((f1) => {
                        StoreActions.featureGroupsDescribe_(projectId, f1?.featureGroupId);
                      });
                    });

                    Location.push('/' + PartsLink.feature_group_detail + '/' + projectId + '/' + featureGroupId, undefined, 'useFGadded=' + encodeURIComponent(values.tableName ?? ''));
                    resolve(null);
                  }
                });
              }
            }
          });
        });
      };

      let config1 = convertConfigToBE(c1);
      REClient_.client_().createFeatureGroupFromTemplate(values.tableName, featureGroupTemplateId, config1, true, values.description, values.lockType?.value, values.tags, cbCreate);

      // Location.push('/'+PartsLink.feature_groups_add+'/'+(projectId ?? '-'), undefined, 'hideTemplate=1&useType=sql&useTemplateId='+encodeURIComponent(featureGroupTemplateId)+'&useConfig='+encodeURIComponent(c1==null ? '' : JSON.stringify(c1)));
    };

    setConfig((c1) => {
      setSql((sql1) => {
        if (isAttach) {
          doWorkAttach(c1, sql1);
        } else {
          if (c1 == null || c1?.length === 0) {
            REActions.addNotificationError('Error: please enter at least one variable');
          } else {
            doWorkCreateTemplate(c1, sql1);
          }
        }

        return sql1;
      });

      return c1;
    });
  };

  const onFormChange = (e) => {
    //
  };

  const usedBeforeAndRemovedNames = useRef({});
  const onChangeFormSql = (value: string) => {
    setSql(value || '');

    if (value) {
      let mm = value.match(/\{[^}]+\}/gi) as any;
      if (mm == null && !_.isArray(mm)) {
        mm = [];
      }

      let res = [];
      mm.some((m1) => {
        m1 = m1.substring(1);
        m1 = m1.substring(0, m1.length - 1);
        res.push(_.trim(m1));
      });

      setDetectedVars(res);
    } else {
      setDetectedVars(null);
    }
  };

  useEffect(() => {
    if (projectId == null && featureGroupTemplateId == null) {
      let sql1 = `select * from {table1}`;
      form?.setFieldsValue({ sql: sql1 });
      onChangeFormSql(sql1);
    }
  }, [projectId, featureGroupTemplateId]);

  let sample1 = null;

  const onClickFiltersEditFormat = (e) => {
    refEditorSql.current?.doFormat();
  };

  const onClickFiltersEditPreviewData = (e) => {
    setConfig((c1) => {
      setSql((sql1) => {
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

        return sql1;
      });
      return c1;
    });
  };

  const onClickFiltersEditPreview = (e) => {
    setConfig((c1) => {
      setSql((sql1) => {
        let config1 = convertConfigToBE(c1);
        refEditorSql.current?.doProcessing(null, () => {
          return refEditorSql.current?.doPreviewTemplateSql(featureGroupTemplateId && !isEdit ? null : sql1, config1, featureGroupTemplateId);
        });

        return sql1;
      });
      return c1;
    });
  };

  const onChangeConfig = (v1) => {
    setConfig(v1);
  };

  const onChangeTemplateAttach = (option1) => {
    forceUpdate();
  };

  useEffect(() => {
    if (useTemplateId != null && optionsTemplate != null) {
      form?.setFieldsValue({ template: optionsTemplate?.find((o1) => o1.value === useTemplateId) });
    }
  }, [useTemplateId, optionsTemplate]);

  const doReplaceSqlVars = useCallback(
    (fromVar: string, toVar: string) => {
      if (!fromVar || !toVar) {
        return;
      }

      setSql((sql1) => {
        if (sql1 != null) {
          sql1 = sql1.replace(createRegExForValueTemplate(fromVar), '{' + toVar + '}');
          form?.setFieldsValue({ sql: sql1 });
          onChangeFormSql(sql1);
        }

        return sql1;
      });
    },
    [form],
  );

  const onDeleteConfig = useCallback(
    (value: ITemplateConfigOne) => {
      if (Utils.isNullOrEmpty(value?.name) || Utils.isNullOrEmpty(value?.value)) {
        return;
      }

      setSql((sql1) => {
        if (sql1 != null) {
          sql1 = sql1.replace(createRegExForValueTemplate(value?.value), value?.name);
          form?.setFieldsValue({ sql: sql1 });
          onChangeFormSql(sql1);
        }

        return sql1;
      });
    },
    [form],
  );

  const testWordInSql = useCallback(
    (value) => {
      let sql1 = form?.getFieldValue('sql');
      value = _.trim(value || '');
      if (!value) {
        return false;
      } else {
        let regExp = createRegExForValueTemplate(value, false);
        return regExp.test(sql1);
      }
    },
    [form],
  );

  const isVarAlreadyUsed = useCallback(
    (value) => {
      let sql1 = form?.getFieldValue('sql');
      value = _.trim(value || '');
      if (!value) {
        return false;
      } else {
        let regExp = createRegExForValueTemplate(value);
        return regExp.test(sql1);
      }
    },
    [form],
  );

  const onIsAnyErrorConfig = useCallback(
    (isAnyError: boolean, detVarsUnused?: string[]) => {
      setIsAnyErrorConfig(isAnyError);
      if (detVarsUnused?.length === 0) {
        detVarsUnused = null;
      }
      setDetectedVarsUnused(detVarsUnused ?? null);
    },
    [sqlUsed],
  );

  const calcIsMissingVar = (value) => {
    if (Utils.isNullOrEmpty(value)) {
      return false;
    }
    let sql1 = sqlUsed;
    if (Utils.isNullOrEmpty(sql1)) {
      return false;
    }

    let regExp = createRegExForValueTemplate(value);
    if (regExp.test(sql1)) {
      return false;
    } else {
      return true;
    }
  };

  const onChangeSelectionEditor = useCallback((v1) => {
    setDefaultNewName(v1);
  }, []);

  const onChangeElemConfigEditor = (value: ITemplateConfigOne) => {
    if (!value || _.isEmpty(value)) {
      return;
    }

    let n1 = value?.name;
    let v1 = value?.value;

    if (v1 != null && n1 != null) {
      setSql((sql1) => {
        if (_.trim(sql1 || '') !== '' && sql1 != null) {
          sql1 = sql1.replace(new RegExp('\\b' + Utils.escapeRegex(n1) + '\\b', 'gi'), `{${v1}}`);
          form?.setFieldsValue({ sql: sql1 || '' });
        }

        return sql1;
      });
    }
  };

  let fgFromProjectId = null;
  if (!isAttach && featureGroupId != null) {
    fgFromProjectId = featureGroupId;
  }

  let editorsSpan1 = (
    <div key={'e1'}>
      <Form.Item
        style={{ marginBottom: 0 }}
        label={
          <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
            {'Config'}:<HelpIcon id={isAttach ? 'template_config_attach' : 'template_config'} />
          </span>
        }
      ></Form.Item>
      <div
        css={`
          margin-right: 10px;
          position: relative;
          ${isAttach ? '' : 'height: ' + (400 - 30 - 3) + 'px;'}
        `}
      >
        <TemplateConfigEditor
          sqlText={sqlUsed}
          useFormEditor={isAttach}
          showDefaultWhenNullName
          hideDefaultText
          isEdit={isEdit}
          fgFromProjectId={fgFromProjectId}
          onChangeElem={onChangeElemConfigEditor}
          defaultNewName={defaultNewName}
          isInlineEdit={isAttach}
          isRelative={isAttach}
          testWordInSql={testWordInSql}
          isVarAlreadyUsed={isVarAlreadyUsed}
          onDeleteConfig={onDeleteConfig}
          doReplaceSql={doReplaceSqlVars}
          detectedVars={detectedVars}
          onIsAnyError={onIsAnyErrorConfig}
          calcIsMissing={calcIsMissingVar}
          editMode={!fullEdit && isAttach}
          configOri={configOri}
          config={config}
          onChange={onChangeConfig}
        />
      </div>
    </div>
  );
  let editorsSpan2 = (
    <div
      key={'e2'}
      css={`
        position: relative;
        ${isAttach ? 'background: rgba(255,255,255,0.1); padding: 10px; border-radius: 3px;' : ''}
      `}
    >
      <Form.Item
        name={'sql'}
        rules={[{ required: true, message: 'Sql' + ' required!' }]}
        style={{ marginBottom: 0 }}
        label={
          <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
            {'Sql Template'}:&nbsp;
            <HelpIcon id={isAttach ? 'template_sql_template_attach' : 'template_sql_template'} />
          </span>
        }
      >
        <EditorElemForFeatureGroup
          onChangeSelection={onChangeSelectionEditor}
          allowResizeHeight={isAttach ? 'hh_edit_sql_template_create' : undefined}
          readSure={!fullEdit && isAttach}
          onlyThisFeatureGroup
          readonly={!fullEdit && isAttach}
          height={400 - 30 - 90}
          lang={null}
          onChange={onChangeFormSql}
          projectId={projectId}
          refEditor={refEditorSql}
          validateTemplate
          featureGroupId={featureGroupId}
          validateFeatureGroupId={undefined}
          validateFeatureTableName={undefined}
        />
      </Form.Item>
    </div>
  );

  let editorsSpans = null;
  if (isAttach) {
    let attachTemplateTexts = config == null ? null : toSpansFromConfig(configOri, false, isSystemTemplate);

    editorsSpans = (
      <div
        css={`
          position: relative;
        `}
      >
        {editorsSpan1}
        <div
          css={`
            height: 20px;
          `}
        >
          &nbsp;
        </div>
        {editorsSpan2}
        <div
          css={`
            height: 5px;
          `}
        >
          &nbsp;
        </div>
        {attachTemplateTexts?.length > 0 && (
          <span
            css={`
              color: white;
              font-size: 14px;
            `}
          >
            Default Values: {attachTemplateTexts}
          </span>
        )}
      </div>
    );
  } else {
    editorsSpans = (
      /* @ts-ignore */
      <SplitPane
        split={'vertical'}
        minSize={230}
        defaultSize={Utils.dataNum('expandsql_template_config', 500)}
        onChange={(v1) => {
          Utils.dataNum('expandsql_template_config', undefined, v1);
        }}
      >
        {editorsSpan1}
        {editorsSpan2}
      </SplitPane>
    );
  }

  const featuresGroupsList = useFeatureGroupFromProject(projectId);

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

  useEffect(() => {
    featureGroups.memFeatureGroupTypesForAdd(true);
  }, [featureGroupsParam]);

  const foundProject1 = useProject(projectId);

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

  return (
    <div style={{ margin: '0 30px' }}>
      <div style={{ margin: '30px auto', maxWidth: '1000px', color: Utils.colorA(1) }}>
        {
          <div>
            <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
              <span>
                {isAttach ? 'Create New Feature Group from Template' : isEdit ? 'Edit Template' : 'Create Template'}
                <HelpIcon id={isAttach ? 'template_create_from_fg' : isEdit ? 'template_edit_sql' : 'template_create_sql'} style={{ marginLeft: '4px' }} />
              </span>
            </div>
            {!isAttach && (
              <div
                css={`
                  font-size: 15px;
                  margin-bottom: 20px;
                  margin-top: -20px;
                  opacity: 0.8;
                `}
              >
                SQL templates allow you to easily create multiple feature groups using the same sql
              </div>
            )}
          </div>
        }
        <EditorElemPreview.Provider value={previewRef.current}>
          <Card style={{ boxShadow: '0 0 4px rgba(0,0,0,0.2)', border: '1px solid ' + Utils.colorA(0.5), backgroundColor: Utils.colorA(0.04), borderRadius: '5px' }} className={sd.grayPanel}>
            {/*// @ts-ignore*/}
            <Spin spinning={isProcessing} size={'large'}>
              {
                <FormExt
                  layout={'vertical'}
                  form={form}
                  onChange={onFormChange}
                  onFinish={handleSubmit}
                  initialValues={{
                    lockType: optionsLock?.find((v1) => v1.value === FGLockType.Org),
                    datasetType: datasetTypeNull.current,
                    shouldAttach: true,
                  }}
                >
                  {!isAttach && (
                    <Form.Item
                      name={'name'}
                      rules={[{ required: true, message: 'Required!' }]}
                      style={{ marginBottom: '10px' }}
                      hasFeedback
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Name:&nbsp;
                          <HelpIcon id={'template_create_name'} />
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
                      />
                    </Form.Item>
                  )}

                  {!isAttach && (
                    <Form.Item
                      name={'description'}
                      style={{ marginBottom: '10px' }}
                      hasFeedback
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Description:&nbsp;
                          <HelpIcon id={'template_create_desc'} />
                        </span>
                      }
                    >
                      <Input placeholder="" autoComplete={'off'} />
                    </Form.Item>
                  )}

                  {projectId != null && !isAttach && (
                    <Form.Item
                      name={'tableName'}
                      rules={[{ required: true, message: 'Table Name required!' }]}
                      style={{ marginBottom: '10px' }}
                      label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>{'Parent Feature Group'}:</span>}
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

                  {!isAttach && !isEdit && (
                    <Form.Item name={'shouldAttach'} valuePropName={'checked'} noStyle label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Should Attach:</span>}>
                      <Checkbox
                        css={`
                          margin: 5px 0 12px;
                        `}
                      >
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>"{form?.getFieldValue('tableName')}" Linked to this template</span>
                      </Checkbox>
                    </Form.Item>
                  )}

                  {isAttach && (
                    <Form.Item
                      name={'template'}
                      style={{ display: !canUseTemplateId ? 'block' : 'none' }}
                      hasFeedback
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Template:&nbsp;
                          <HelpIcon id={'template_template_one'} />
                        </span>
                      }
                    >
                      <SelectExt options={optionsTemplate} onChange={onChangeTemplateAttach} />
                    </Form.Item>
                  )}

                  {isAttach && !canUseTemplateId && (
                    <div
                      css={`
                        margin-top: 20px;
                      `}
                    >
                      &nbsp;
                    </div>
                  )}

                  {isAttach && (
                    <Form.Item
                      name={'tableName'}
                      rules={[{ required: true, message: 'Table Name required!' }]}
                      style={{ marginBottom: '10px' }}
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          {'Table Name'}:&nbsp;
                          <HelpIcon id={'template_create_name_attach'} />
                        </span>
                      }
                    >
                      <Input placeholder="" autoComplete={'off'} />
                    </Form.Item>
                  )}

                  {isAttach && (
                    <Form.Item
                      name={'description'}
                      style={{ marginBottom: '10px' }}
                      hasFeedback
                      label={
                        <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                          Description:&nbsp;
                          <HelpIcon id={'template_create_desc_attach'} />
                        </span>
                      }
                    >
                      <Input placeholder="" autoComplete={'off'} />
                    </Form.Item>
                  )}

                  {isAttach && (
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
                            Tags:&nbsp;
                            <HelpIcon id={'template_create_tags_attach'} />
                          </span>
                        }
                      >
                        <SelectReactExt placeholder={'Enter keywords/tags to describe this feature group'} allowCreate allowReOrder mode={'multiple'} allowClear options={optionsTags} />
                      </Form.Item>
                    </div>
                  )}

                  {isAttach && (
                    <div
                      css={`
                        margin-top: 20px;
                      `}
                    >
                      &nbsp;
                    </div>
                  )}

                  {isAttach && (
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

                  {isAttach && (
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

                  <div css={isAttach ? `padding: 14px; border-radius: 4px; margin-top: 20px;` : ''} className={isAttach ? sd.grayPanel : ''}>
                    {isAttach && (
                      <div
                        css={`
                          color: white;
                          margin-bottom: 20px;
                        `}
                      >
                        Enter Template Variables&nbsp;
                        <HelpIcon id={'template_enter_vars'} />
                      </div>
                    )}
                    {
                      <div
                        css={`
                          ${isAttach ? 'margin-top: 10px;' : 'height: 400px;'} position: relative;
                        `}
                      >
                        {editorsSpans}

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
                    }
                  </div>

                  {detectedVarsUnused != null && detectedVarsUnused?.length > 0 && (
                    <div
                      css={`
                        font-size: 13px;
                        text-align: center;
                        margin: 3px 0;
                        color: red;
                      `}
                    >{`SQL missing variables ${detectedVarsUnused.map((s1) => '"' + s1 + '"').join(', ')} in config list`}</div>
                  )}
                  <div style={{ borderTop: '1px solid ' + Utils.colorA(0.06), margin: '20px -22px 10px' }}></div>
                  <div style={{ textAlign: 'center' }}>
                    {!useTemplateId && (
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
                    {
                      <Button
                        disabled={isRefreshingEditorFilter}
                        type={'default'}
                        ghost
                        onClick={onClickFiltersEditPreview}
                        css={`
                          margin-right: 10px;
                        `}
                      >
                        Preview SQL
                      </Button>
                    }
                    {
                      <Button
                        disabled={isRefreshingEditorFilter}
                        type={'default'}
                        ghost
                        onClick={onClickFiltersEditPreviewData}
                        css={`
                          margin-right: 10px;
                        `}
                      >
                        Preview Data
                      </Button>
                    }
                    <Button disabled={isRefreshingEditorFilter || isAnyErrorConfig} type="primary" htmlType="submit" className="login-form-button" style={{ marginTop: '16px' }}>
                      {isAttach ? 'Submit' : isEdit ? 'Save Changes' : 'Add New Template'}
                    </Button>
                  </div>
                </FormExt>
              }
            </Spin>
          </Card>

          {<EditorElemPreviewGrid projectId={projectId} featureGroupId={undefined} />}
        </EditorElemPreview.Provider>
      </div>
    </div>
  );
});

export default TemplateOne;
