import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Provider, useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useFeatureGroup, useFeatureGroupFromProject, useFeatureGroupsAll } from '../../api/REUses';
import { ETemplatesOneType, ETemplatesOneTypeDefault, ETemplatesOneTypePlaceholder, ETemplatesOneTypeSupportedOnPythonFunctions, ITemplateConfig, ITemplateConfigOne, convertBEToConfig } from '../../stores/reducers/templates';
import HelpIcon from '../HelpIcon/HelpIcon';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import NanoScroller from '../NanoScroller/NanoScroller';
import SelectExt from '../SelectExt/SelectExt';
import TooltipExt from '../TooltipExt/TooltipExt';

const s = require('./TemplateConfigEditor.module.css');
const sd = require('../antdUseDark.module.css');

const showType = true;
const IsRequiredWW = 20;
const typeWWcolumn = 60;
const editWWcolumn = 50;
const removeWWcolumn = 24;

export const toSpansFromConfig = (valueFromBE: any, doConvert = true, isSystemTemplate = false) => {
  let res = [];

  let value = doConvert ? convertBEToConfig(valueFromBE) : valueFromBE;

  value?.some((c1, c1ind) => {
    // if(isSystemTemplate===true) {
    //   if(c1.type==='table_name') {
    //     return;
    //   }
    // }

    if (res.length > 0) {
      res.push(<span key={'sep' + c1ind}>, </span>);
    }

    res.push(
      <span key={'r' + c1ind}>
        <span
          css={`
            opacity: 0.7;
          `}
        >
          {c1.value}
        </span>
        &nbsp;-&nbsp;
        <span
          css={`
            margin-left: 5px;
          `}
        >
          {c1.name}
        </span>
      </span>,
    );
  });

  return res;
};

interface IFormEditRowProps {
  nameOri?;

  isAdd?;

  name?;
  value?;
  type?: ETemplatesOneType;
  isRequired?: boolean;

  onChange?: (values?: any) => void;

  isSystemTemplate?: boolean;

  defaultNewValueTable?: string;
  defaultNewValueColumn?: string;
  defaultNewValueVar?: string;

  useDefault?;
  optionsType?;
  optionsFGAll?;
  optionsColumnsAll?;

  tableNameAlreadyUsed?: string[];

  editMode?;
  readonly?;
  sqlText?: string;
}

const FormEditRow = React.memo((props: PropsWithChildren<IFormEditRowProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const doCheckDefault = (value) => {
    return !Utils.isNullOrEmpty(props.nameOri) && _.trim(value || '') === _.trim(props.nameOri || '');
  };

  const [name, setName] = useState(props.name || '');
  const [value, setValue] = useState(props.value || '');
  const [type, setType] = useState(props.type || ETemplatesOneType.TABLE);
  const [isDefault, setIsDefault] = useState(props.useDefault ? doCheckDefault(props.name) : false);
  const [isRequired, setIsRequired] = useState(!!props.isRequired);
  const [isCustomValue, setIsCustomValue] = useState(false);
  const [variableOptions, setVariableOptions] = useState(null);
  const refAlreadySetDefaults = useRef(false);
  useEffect(() => {
    if (refAlreadySetDefaults.current) {
      return;
    }
    refAlreadySetDefaults.current = true;

    //
    if (!Utils.isNullOrEmpty(props.value)) {
      props.onChange?.({ value: props.value });
    }
    if (!Utils.isNullOrEmpty(props.name)) {
      props.onChange?.({ name: props.name });
    }
    if (props.isRequired != null) {
      props.onChange?.({ isRequired: props.isRequired });
    }
  }, [props.value, props.name, props.isRequired]);

  const optionsList = useMemo(() => {
    if (variableOptions) {
      return variableOptions.map((item) => ({ label: item, value: item }));
    } else if (type === ETemplatesOneType.COLUMN) {
      return props.optionsColumnsAll;
    } else {
      if (props.tableNameAlreadyUsed == null || props.tableNameAlreadyUsed?.length === 0) {
        return props.optionsFGAll;
      } else {
        return props.optionsFGAll?.filter((o1) => !props.tableNameAlreadyUsed?.includes(o1.label));
      }
    }
  }, [props.optionsFGAll, props.optionsColumnsAll, type, props.tableNameAlreadyUsed, variableOptions]);

  useEffect(() => {
    if (!props.sqlText) {
      return;
    }

    const templateVariables = [{ name: value, value: name, valueType: type, isRequired }];

    REClient_.client_()._getFeatureGroupTemplateVariableOptions(props.sqlText, templateVariables, (err, res) => {
      if (err || !res?.success) {
        setVariableOptions(null);
      } else {
        const templateVarOptions = res?.result?.templateVariableOptions;
        const templateVarOption = templateVarOptions?.find((item) => item.name === value && item.options?.length > 0);
        if (templateVarOption) {
          setVariableOptions(templateVarOption.options);
        } else {
          setVariableOptions(null);
        }
      }
    });
  }, [type]);

  useEffect(() => {
    if (!variableOptions) {
      setIsCustomValue(false);
    }
  }, [variableOptions]);

  const isDropdown = useMemo(() => {
    return ([ETemplatesOneType.TABLE, ETemplatesOneType.COLUMN, ETemplatesOneType.FEATURE_GROUP].includes(type) || variableOptions != null) && !isCustomValue;
  }, [type, variableOptions, isCustomValue]);

  const onChangeValue = (e) => {
    setIsDefault(doCheckDefault(e.target.value));
    setName(e.target.value);
    props.onChange?.({ name: e.target.value });
  };

  return (
    <div>
      <div
        css={`
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          font-family: Matter;
          font-size: 24px;
          line-height: 1.33;
        `}
      >
        {props.isAdd ? 'Add' : 'Edit'} Variable
      </div>
      <div
        css={`
          padding-bottom: 15px;
          font-size: 14px;
          opacity: 0.8;
          margin-bottom: 10px;
          font-weight: normal;
        `}
      >
        Replace any of the feature group names with variables
      </div>
      <div
        css={`
          margin-top: 12px;
          & .ant-input {
            width: 100%;
          }
        `}
      >
        <div
          css={`
            font-size: 14px;
            margin-bottom: 6px;
            text-transform: uppercase;
            font-family: Roboto;
            font-size: 12px;
            letter-spacing: 1.12px;
          `}
        >
          Variable Name:
          <HelpIcon id={'template_add_var_name'} style={{ marginLeft: '4px' }} />
        </div>
        <Input
          css={`
            margin-right: 10px;
            width: 200px;
            margin-top: 3px;
          `}
          disabled={props.editMode || props.readonly}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            props.onChange?.({ value: e.target.value });
          }}
        />
      </div>
      {showType && (
        <div
          css={`
            margin-top: 5px;
            margin-bottom: 6px;
            font-size: 13px;
          `}
        >
          <div
            css={`
              font-size: 14px;
              margin-bottom: 6px;
              text-transform: uppercase;
              font-family: Roboto;
              font-size: 12px;
              letter-spacing: 1.12px;
            `}
          >
            Type:
            <HelpIcon id={'template_add_type'} style={{ marginLeft: '4px' }} />
          </div>
          <SelectExt
            isDisabled={props.readonly || props.editMode}
            value={props.optionsType?.find((o1) => o1.value === (type || ETemplatesOneType.TABLE))}
            options={props.optionsType}
            onChange={(e) => {
              let v1: ETemplatesOneType = e?.value;
              setType(v1);
              props.onChange?.({ type: v1 });

              const isValueDefaultOne = [props.defaultNewValueColumn, props.defaultNewValueTable, props.defaultNewValueVar].includes(value || '---');

              if (v1 === ETemplatesOneType.TABLE) {
                if (isValueDefaultOne) {
                  setValue(props.defaultNewValueTable);
                  props.onChange?.({ value: props.defaultNewValueTable });
                }
              } else if (v1 === ETemplatesOneType.COLUMN) {
                if (isValueDefaultOne) {
                  setValue(props.defaultNewValueColumn);
                  props.onChange?.({ value: props.defaultNewValueColumn });
                }
              } else {
                if (isValueDefaultOne) {
                  setValue(props.defaultNewValueVar);
                  props.onChange?.({ value: props.defaultNewValueVar });
                }
              }
            }}
          />
        </div>
      )}
      {false && props.useDefault && (
        <div
          css={`
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 15px;
          `}
        >
          <Checkbox
            checked={isDefault}
            onChange={(e) => {
              let v1 = e.target.checked;
              if (v1) {
                setIsDefault(v1);
                setName(props.nameOri || '');
                props.onChange?.({ name: props.nameOri || '' });
              }
            }}
          >
            <span
              css={`
                color: white;
                font-size: 12px;
              `}
            >
              Is Default Value
              <HelpIcon id={'template_add_is_default'} style={{ marginLeft: '4px' }} />
            </span>
          </Checkbox>
        </div>
      )}
      <div
        css={`
          margin-top: 14px;
        `}
      >
        <div
          css={`
            font-size: 14px;
            margin-bottom: 6px;
            text-transform: uppercase;
            font-family: Roboto;
            font-size: 12px;
            letter-spacing: 1.12px;
          `}
        >
          {!props.readonly && !props.editMode ? 'Default Value' : 'Value'}:<HelpIcon id={'template_add_var_value'} style={{ marginLeft: '4px' }} />
          {variableOptions && (
            <span css={'margin-left: 20px'}>
              <Checkbox
                checked={isCustomValue}
                onChange={(e) => {
                  let v1 = e.target.checked;
                  setIsCustomValue(v1);
                  if (v1) {
                    onChangeValue({ target: { value: '' } });
                  }
                }}
              >
                <span
                  css={`
                    color: white;
                    text-transform: none;
                  `}
                >
                  Enter custom value?
                </span>
              </Checkbox>
            </span>
          )}
        </div>
        {!isDropdown && (
          <Input
            placeholder={ETemplatesOneTypePlaceholder?.[type] || ''}
            css={`
              width: 100%;
            `}
            disabled={props.readonly}
            value={name}
            onChange={onChangeValue}
          />
        )}
        {isDropdown && (
          <SelectExt
            css={`
              font-size: 14px;
              width: 100%;
            `}
            isDisabled={props.readonly}
            value={optionsList?.find((o1) => o1.tableName === name || o1.value === name) ?? optionsList?.find((o1) => o1.tableName === props.nameOri || o1.value === props.nameOri)}
            options={optionsList}
            onChange={(e) => {
              let v1 = type === ETemplatesOneType.COLUMN || variableOptions ? e?.value : e?.tableName;
              setIsDefault(doCheckDefault(v1));
              setName(v1);
              props.onChange?.({ name: v1 });
            }}
          />
        )}
      </div>
      {
        /*(!props.isSystemTemplate || props.type!=='table_name') && */ props.useDefault && !Utils.isNullOrEmpty(props.nameOri) && (
          <div
            css={`
              font-size: 12px;
              opacity: 0.7;
              text-align: center;
              color: white;
              margin-top: 4px;
            `}
          >
            Default Value: {props.nameOri}
          </div>
        )
      }
      <div
        css={`
          margin-top: 14px;
        `}
      >
        <Checkbox
          checked={isRequired}
          onChange={(e) => {
            let v1 = e.target.checked;
            setIsRequired(v1);
            props.onChange?.({ isRequired: v1 });
          }}
        >
          <span
            css={`
              color: white;
            `}
          >
            Is Required
            <HelpIcon id={'template_add_var_is_required'} style={{ marginLeft: '4px' }} />
          </span>
        </Checkbox>
      </div>
    </div>
  );
});

interface ITemplateConfigEditorRowProps {
  isAdd?: boolean;

  isPythonFunction?: boolean;
  isSystemTemplate?: boolean;
  defaultNewName?: string;
  defaultNewValueTable?: string;
  defaultNewValueColumn?: string;
  defaultNewValueVar?: string;
  hideEdit?: boolean;
  useFormName?: string;
  isInlineEdit?: boolean;
  showDefaultWhenNullName?: boolean;
  hideDefaultText?: boolean;
  tableNameAlreadyUsed?: string[];
  dataOri?: ITemplateConfigOne;
  data?: ITemplateConfigOne;
  isMissing?: boolean;
  onChangeName?: (name: string) => void;
  onChangeType?: (type: ETemplatesOneType) => void;
  onChangeValue?: (value: string) => void;
  onChangeIsRequired?: (value: boolean) => void;
  onChangeAll?: (value?, type?, name?, isRequired?) => string;
  onDelete?: (e) => void;
  fgList?: any[];
  dropdownMaxChars?: number;
  featuresListUsedFG?: { tableName?; name?; dataType?; featureType?; sourceTable? }[];
  readonly?: boolean;
  editMode?: boolean;
  isEdit?: boolean;
  sqlText?: string;
}

const TemplateConfigEditorRow = React.memo((props: PropsWithChildren<ITemplateConfigEditorRowProps>) => {
  const [variableOptions, setVariableOptions] = useState(null);
  const [isCustomValue, setIsCustomValue] = useState(false);

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const optionsType = useMemo(() => {
    let res = [
      {
        label: 'Table',
        value: ETemplatesOneType.TABLE,
      },
      {
        label: 'Column',
        value: ETemplatesOneType.COLUMN,
      },
      {
        label: 'Where',
        value: ETemplatesOneType.WHERE,
      },
      {
        label: 'Group By',
        value: ETemplatesOneType.GROUP_BY,
      },
      {
        label: 'Filter',
        value: ETemplatesOneType.FILTER,
      },
      {
        label: 'SQL Snippet',
        value: ETemplatesOneType.SQL_FRAGMENT,
      },
      {
        label: 'String',
        value: ETemplatesOneType.STRING,
      },
    ];

    if (props.isPythonFunction) {
      res.push({
        label: 'FEATURE_GROUP',
        value: ETemplatesOneType.FEATURE_GROUP,
      });

      res = res?.filter((r1) => ETemplatesOneTypeSupportedOnPythonFunctions.includes(r1?.value));
    }

    if (res != null) {
      res = _.sortBy(res, 'label');
    }

    return res;
  }, [props.isPythonFunction]);

  const onChangeIsRequired = (e) => {
    let v1 = e.target.checked;
    props.onChangeIsRequired?.(v1);
  };

  const onChangeValue = (e) => {
    let v1 = e.target.value;
    props.onChangeValue?.(v1);
  };

  const onChangeName = (e) => {
    props.onChangeName?.(e.target.value);
  };

  const onChangeTable = (option1) => {
    props.onChangeName?.(props.data?.type === ETemplatesOneType.COLUMN || variableOptions ? option1?.value : option1?.tableName);
  };

  const onChangeType = (option1) => {
    let v1: ETemplatesOneType = option1?.value;
    props.onChangeType?.(v1);
  };

  const optionsFGAll = useMemo(() => {
    let res: any[] = props.fgList?.map((f1) => ({ label: f1.tableName, value: f1.featureGroupId, tableName: f1.tableName }));
    if (res != null) {
      res.unshift({ label: '(None)', value: null });
    }
    return res;
  }, [props.fgList]);
  const optionsFGAllWithoutNone = useMemo(() => {
    let res: any[] = props.fgList?.map((f1) => ({ label: f1.tableName, value: f1.featureGroupId, tableName: f1.tableName }));
    return res;
  }, [props.fgList]);

  const optionsColumnsAll = useMemo(() => {
    const max = props.dropdownMaxChars;
    let res: any[] = props.featuresListUsedFG?.map((f1) => ({
      tooltipPos: 'right',
      tooltipShow: f1.tableName + ': ' + f1.name,
      label: (f1.tableName?.length > max ? '...' + f1.tableName?.substring(f1.tableName.length - max, f1.tableName.length) : f1.tableName) + ': ' + f1.name,
      value: f1.tableName + '.' + f1.name,
      tableName: f1.tableName,
      columnName: f1.name,
    }));
    res ??= [];
    res.unshift({ label: '(None)', value: null });
    return res;
  }, [props.featuresListUsedFG, props.dropdownMaxChars]);

  const onChangeIsDefault = (e) => {
    let v1 = e.target.checked;
    if (v1) {
      props.onChangeName?.(props.dataOri?.name);
    }
  };

  const useDefault = useMemo(() => {
    return props.dataOri != null && props.editMode;
  }, [props.dataOri, props.editMode]);

  const isDefault = useMemo(() => {
    return props.data?.name === props.dataOri?.name;
  }, [props.data, props.dataOri]);

  const errMsg = useMemo(() => {
    if (!props.data?.value) {
      return `Required variable name`;
    }
    if (!props.data?.name && !props.dataOri?.name) {
      return `Required variable default value`;
    }
    if (props.isMissing) {
      return `Missing in sql, add {${props.data?.value}} in your sql`;
    }
    return null;
  }, [props.isMissing, props.data?.name, props.data?.value, props.dataOri?.name]);

  const editValues = useRef({} as { name?; value?; type?; isRequired? });

  let editElem = (
    <Provider store={Utils.globalStore()}>
      <div className={'useDark'}>
        <FormEditRow
          sqlText={props.sqlText}
          isRequired={props.data?.isRequired}
          defaultNewValueTable={props.defaultNewValueTable}
          defaultNewValueVar={props.defaultNewValueVar}
          defaultNewValueColumn={props.defaultNewValueColumn}
          isSystemTemplate={props.isSystemTemplate}
          isAdd={props.isAdd}
          tableNameAlreadyUsed={props.tableNameAlreadyUsed}
          useDefault={useDefault}
          nameOri={props.dataOri?.name}
          name={props.data?.name ?? props.defaultNewName}
          value={
            props.data?.value ??
            ((props.data?.type ?? ETemplatesOneType.TABLE) === ETemplatesOneType.TABLE
              ? props.defaultNewValueTable
              : (props.data?.type ?? ETemplatesOneType.TABLE) === ETemplatesOneType.COLUMN
              ? props.defaultNewValueColumn
              : props.defaultNewValueVar)
          }
          type={props.data?.type}
          onChange={(v1) => {
            editValues.current = _.assign({}, editValues.current ?? {}, v1 ?? {});
          }}
          editMode={props.editMode}
          readonly={props.readonly}
          optionsType={optionsType}
          optionsColumnsAll={optionsColumnsAll}
          optionsFGAll={optionsFGAll}
        />
      </div>
    </Provider>
  );

  const onClickEdit = () => {
    editValues.current = {
      name: props.data?.name || '',
      value: props.data?.value || '',
      type: props.data?.type ?? ETemplatesOneType.TABLE,
      isRequired: props.data?.isRequired,
    };
  };

  const onConfirmVar = () => {
    return new Promise<boolean>((resolve) => {
      let err1 = null;

      let isValueRequired = false;
      if (optionsFGAll?.find((o1) => o1.label === editValues.current?.name) == null && optionsColumnsAll?.find((o1) => o1.value === editValues.current?.name) == null) {
        if ([ETemplatesOneType.COLUMN, ETemplatesOneType.TABLE, ETemplatesOneType.FEATURE_GROUP].includes(editValues.current?.type)) {
          isValueRequired = true;
        }
      }

      if (_.trim(editValues.current?.value || '') === '') {
        err1 = 'Name is required!';
      } else if (_.trim(editValues.current?.name || '') === '' || isValueRequired) {
        err1 = 'Value is required!';
      }

      if (err1 == null) {
        err1 = props.onChangeAll?.(editValues.current?.value, editValues.current?.type, editValues.current?.name, editValues.current?.isRequired);
      }
      if (err1) {
        REActions.addNotificationError(err1);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  };

  if (props.isAdd) {
    return (
      <ModalConfirm onConfirmPromise={onConfirmVar} onClick={onClickEdit} title={editElem} okText={'Add'} cancelText={'Cancel'} okType={'primary'} width={800}>
        <Button
          css={`
            margin-top: 8px;
          `}
          type={'primary'}
          size={'small'}
        >
          Add Variable
        </Button>
      </ModalConfirm>
    );
  }

  let defValue = null;
  // if((useDefault && props.dataOri?.name && !props.data?.name && !props.readonly && !props.editMode && !props.isEdit) || (props.showDefaultWhenNullName && !props.data?.name)) {
  //   defValue = { label: props.showDefaultWhenNullName ? '(Default)' : '', value: null };
  // }

  const createFormOneIfNeeded = (elem1, isRequired = true) => {
    if (elem1 == null) {
      return null;
    }

    if (props.useFormName) {
      return (
        <Form.Item name={props.useFormName} rules={isRequired ? [{ required: true, message: 'Required!' }] : undefined} style={{ margin: 0 }}>
          {elem1}
        </Form.Item>
      );
    } else {
      return elem1;
    }
  };

  const isDropdown = useMemo(() => {
    return ([ETemplatesOneType.TABLE, ETemplatesOneType.COLUMN, ETemplatesOneType.FEATURE_GROUP].includes(props.data?.type) || variableOptions != null) && !isCustomValue;
  }, [props.data, variableOptions, isCustomValue]);

  useEffect(() => {
    if (!variableOptions) {
      setIsCustomValue(false);
    }
  }, [variableOptions]);

  useEffect(() => {
    if (!props.sqlText || !props.isInlineEdit) {
      return;
    }

    const templateVariables = [{ name: props.data?.value, value: props.data?.name, valueType: props.data?.type, isRequired: props.data?.isRequired }];

    REClient_.client_()._getFeatureGroupTemplateVariableOptions(props.sqlText, templateVariables, (err, res) => {
      if (err || !res?.success) {
        setVariableOptions(null);
      } else {
        const templateVarOptions = res?.result?.templateVariableOptions;
        const templateVarOption = templateVarOptions?.find((item) => item.name === props.data?.value && item.options?.length > 0);
        if (templateVarOption) {
          setVariableOptions(templateVarOption.options);
        } else {
          setVariableOptions(null);
        }
      }
    });
  }, [props.data]);

  const dropdownOptions = useMemo(() => {
    if (variableOptions) {
      return variableOptions.map((item) => ({ label: item, value: item }));
    } else if (props.data?.type === ETemplatesOneType.COLUMN) {
      return optionsColumnsAll;
    } else {
      return props.data?.isRequired ? optionsFGAllWithoutNone : optionsFGAll;
    }
  }, [props.data, optionsColumnsAll, optionsFGAllWithoutNone, optionsFGAll, variableOptions]);

  let dropdownValue = dropdownOptions?.find((o1) => o1.tableName === props.data?.name || o1.value === props.data?.name);
  dropdownValue = dropdownValue ?? (dropdownOptions?.length > 0 ? dropdownOptions[0] : null);

  return (
    <div
      css={`
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        padding: 4px 8px;
      `}
    >
      {/*{false && useDefault && <div css={`display: flex; justify-content: center; align-items: center;`}>*/}
      {/*  <Checkbox disabled={!props.isInlineEdit} checked={isDefault} onChange={onChangeIsDefault}><span css={`color: white; font-size: 12px;`}>Is Default Value</span></Checkbox>*/}
      {/*</div>}*/}
      <div
        css={`
          display: flex;
          align-items: center;
          color: white;
        `}
      >
        {!props.isInlineEdit && !props.hideEdit && (
          <div
            css={`
              width: ${editWWcolumn}px;
            `}
          >
            {
              <ModalConfirm onConfirmPromise={onConfirmVar} onClick={onClickEdit} title={editElem} okText={'Save'} cancelText={'Cancel'} okType={'primary'} width={800}>
                <Button
                  disabled={optionsFGAll == null || props.readonly}
                  css={`
                    font-size: 12px;
                  `}
                  type={'primary'}
                  ghost
                  size={'small'}
                >
                  Edit
                </Button>
              </ModalConfirm>
            }
          </div>
        )}
        {
          <Checkbox
            css={`
              margin-right: 10px;
              width: ${IsRequiredWW}px;
              margin-top: 3px;
            `}
            className={props.readonly || !props.isInlineEdit ? sd.pointerEventsNone : ''}
            /*disabled={props.readonly || !props.isInlineEdit}*/ checked={!!props.data?.isRequired}
            onChange={props.readonly || !props.isInlineEdit ? null : onChangeIsRequired}
          />
        }
        {/*{false && <Input css={`margin-right: 10px; width: 200px; margin-top: 3px;`} disabled={true || (!props.editMode && props.readonly)} value={props.data?.value} onChange={onChangeValue} />}*/}
        <div
          css={`
            margin-right: 10px;
            flex: 3;
            margin-top: 3px;
          `}
        >
          {props.data?.value}
        </div>
        {showType && (
          <div
            css={`
              width: ${props.isPythonFunction ? 120 : typeWWcolumn}px;
              white-space: normal;
            `}
          >
            {false && <SelectExt isDisabled={true || props.readonly || props.editMode} value={optionsType?.find((o1) => o1.value === (props.data?.type ?? ETemplatesOneType.TABLE))} options={optionsType} onChange={onChangeType} />}
            {optionsType?.find((o1) => o1.value === (props.data?.type ?? ETemplatesOneType.TABLE))?.label}
          </div>
        )}
        <div
          css={`
            display: flex;
            align-items: center;
            margin-top: 4px;
            flex: 7;
          `}
        >
          <div
            css={`
              margin-left: 5px;
              flex: 1;
              white-space: normal;
            `}
          >
            {props.isInlineEdit &&
              !isDropdown &&
              createFormOneIfNeeded(
                <Input
                  placeholder={ETemplatesOneTypePlaceholder?.[props.data?.type] || ''}
                  css={`
                    width: 100%;
                  `}
                  disabled={props.readonly}
                  value={props.data?.name}
                  onChange={onChangeName}
                />,
                props.data?.isRequired === true,
              )}
            {props.isInlineEdit &&
              isDropdown &&
              (dropdownOptions
                ? createFormOneIfNeeded(
                    <SelectExt
                      showTooltips
                      css={`
                        width: 100%;
                      `}
                      isDisabled={props.readonly}
                      defaultValue={props.isPythonFunction ? dropdownValue : undefined}
                      value={dropdownValue}
                      options={dropdownOptions}
                      onChange={onChangeTable}
                    />,
                  )
                : createFormOneIfNeeded(
                    <SelectExt
                      showTooltips
                      css={`
                        width: 100%;
                      `}
                      isDisabled={props.readonly}
                    />,
                    props.data?.isRequired === true,
                  ))}
            {!props.isInlineEdit && !isDropdown && <div>{props.data?.name}</div>}
            {!props.isInlineEdit && isDropdown && (
              <div>{(props.data?.type === ETemplatesOneType.COLUMN ? optionsColumnsAll?.find((o1) => o1.value === props.data?.name)?.label : optionsFGAll?.find((o1) => o1.tableName === props.data?.name)?.label) ?? props.data?.name}</div>
            )}
          </div>
        </div>
        {!(props.readonly || props.editMode) && (
          <div
            css={`
              padding-left: 5px;
              display: flex;
              align-items: center;
              opacity: 0.8;
              padding-top: 4px;
              width: ${removeWWcolumn}px;
            `}
          >
            <FontAwesomeIcon onClick={props.onDelete} icon={require('@fortawesome/pro-solid-svg-icons/faCircleXmark').faCircleXmark} transform={{ size: 19, x: 0, y: 0 }} style={{ cursor: 'pointer', marginLeft: '4px', color: 'red' }} />
          </div>
        )}
      </div>
      <div css={'display: flex'}>
        <div css={'flex: 0.9'}></div>
        <div css={'display: flex; flex: 1.1; margin-top: 4px;'}>
          {((useDefault && !props.isInlineEdit) || props.showDefaultWhenNullName) /*&& (!props.isSystemTemplate || props.data?.type!=='table_name')*/ && !props.hideDefaultText && !Utils.isNullOrEmpty(props.dataOri?.name) && (
            <div
              css={`
                font-size: 12px;
                opacity: 0.7;
                color: white;
              `}
            >
              Default Value: {props.dataOri?.name}
            </div>
          )}
          {variableOptions && (
            <span css={'margin-left: 20px'}>
              <Checkbox
                checked={isCustomValue}
                onChange={(e) => {
                  let v1 = e.target.checked;
                  setIsCustomValue(v1);
                  if (v1) {
                    onChangeName({ target: { value: '' } });
                  }
                }}
              >
                <span
                  css={`
                    color: white;
                  `}
                >
                  Enter custom value?
                </span>
              </Checkbox>
            </span>
          )}
        </div>
      </div>
      {errMsg && (
        <div
          css={`
            font-size: 13px;
            text-align: center;
            margin: 3px 0;
            color: red;
          `}
        >
          {errMsg}
        </div>
      )}
    </div>
  );
});

interface ITemplateConfigEditorProps {
  configOri?: ITemplateConfig;

  fgFromProjectId?: string;
  hideEdit?: boolean;
  isEdit?: boolean;
  useFormEditor?: boolean;
  config?: ITemplateConfig;
  onChange?: (newValue: ITemplateConfig) => void;
  onChangeElem?: (value: ITemplateConfigOne) => void;
  testWordInSql?: (value: string) => boolean;
  isVarAlreadyUsed?: (value: string) => boolean;
  doReplaceSql?: (fromVar: string, toVar: string) => void;
  onDeleteConfig?: (value: ITemplateConfigOne) => void;
  readonly?: boolean;
  editMode?: boolean;

  defaultNewName?: string;
  isInlineEdit?: boolean;
  isRelative?: boolean;
  isPythonFunction?: boolean;
  isSystemTemplate?: boolean;
  dropdownMaxChars?: number;
  showDefaultWhenNullName?: boolean;
  hideDefaultText?: boolean;
  calcIsMissing?: (value: string) => boolean;
  onIsAnyError?: (isAnyError: boolean, detVarsUnused?: string[]) => void;
  detectedVars?: string[];
  sqlText?: string;
}

const TemplateConfigEditor = React.memo((props: PropsWithChildren<ITemplateConfigEditorProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [fgDescribeDict, setFgDescribeDict] = useState(null);

  const onChangeAll = (configOne, value, type, name, isRequired) => {
    let config1 = [...(props.config ?? [])];

    if (configOne === null) {
      let c1: ITemplateConfigOne = {};
      c1.name = name || '';
      c1.type = type ?? ETemplatesOneTypeDefault;
      c1.value = value;
      c1.isRequired = isRequired;
      config1.push(c1);

      props.onChangeElem?.(c1);
      props.onChange?.(config1);
      return;
    }

    let doReplace = null;

    if (_.trim(value || '') !== '') {
      let ff = config1?.filter((o1) => o1.value === value && o1 !== configOne);
      if (ff.length > 0) {
        return 'Variable name already used';
      }
    }

    let ind1 = _.findIndex(config1, (o1) => o1 === configOne);
    if (ind1 > -1) {
      let c1 = { ...(config1[ind1] ?? {}) };
      if (value != null) {
        if (_.trim(c1.value || '').toLowerCase() !== _.trim(value || '').toLowerCase()) {
          if (!props.isVarAlreadyUsed?.(value)) {
            doReplace = [c1.value, value];
          }
        }
        c1.value = value;
      }
      if (name != null) {
        c1.name = name;
      }
      if (type != null) {
        c1.type = type;
      }
      if (isRequired != null) {
        c1.isRequired = isRequired;
      }
      c1.type ??= ETemplatesOneTypeDefault;
      config1[ind1] = c1;

      //
      props.onChangeElem?.(c1);
      props.onChange?.(config1);

      if (doReplace != null) {
        props.doReplaceSql?.(doReplace?.[0], doReplace?.[1]);
      }
      return;
    }
  };

  const onChangeOne = (configOne, isName, value) => {
    let config1 = [...(props.config ?? [])];

    const isValue = isName === 'value';
    const isRequired = isName === 'isRequired';

    if (configOne === null) {
      let c1: ITemplateConfigOne = {};
      if (isValue) {
        c1.name = '';
        c1.type = ETemplatesOneTypeDefault;
        c1.value = value;
        c1.isRequired = false;
      } else if (isName) {
        c1.name = value;
        c1.type = ETemplatesOneTypeDefault;
        c1.value = '';
        c1.isRequired = false;
      } else {
        c1.name = '';
        c1.type = value;
        c1.value = '';
        c1.isRequired = false;
      }
      config1.push(c1);

      props.onChange?.(config1);
      return;
    }

    let ind1 = _.findIndex(config1, (o1) => o1 === configOne);
    if (ind1 > -1) {
      let c1 = { ...(config1[ind1] ?? {}) };
      if (isValue) {
        c1.value = value;
      } else if (isName) {
        c1.name = value;
      } else if (isRequired) {
        c1.isRequired = value;
      } else {
        c1.type = value;
      }
      config1[ind1] = c1;

      props.onChange?.(config1);
      return;
    }
  };

  const fgListAll = useFeatureGroupsAll();
  const fgListProjectFGForProject = useFeatureGroupFromProject(props.isPythonFunction ? props.fgFromProjectId : null);
  const fgListProjectFGOne = useFeatureGroup(null, props.isPythonFunction ? null : props.fgFromProjectId);
  const fgListProject = useMemo(() => {
    return fgListProjectFGOne?.sourceTableInfos?.map((s1, s1ind) => ({ tableName: s1?.sourceTable, featureGroupId: s1?.featureGroupId }));
  }, [fgListProjectFGOne]);
  const fgList = props.fgFromProjectId == null ? fgListAll : props.isPythonFunction ? fgListProjectFGForProject : fgListProject;

  const fgNamesUsedInConfig = useMemo(() => {
    let res = null,
      already = {};

    props.config?.some((c1) => {
      if (c1?.type === ETemplatesOneType.TABLE) {
        if (already[c1?.name]) {
          return;
        }
        already[c1?.name] = true;

        res ??= [];
        res.push(c1?.name);
      }
    });

    fgListProject?.some((fg1) => {
      let n1 = fg1?.tableName;
      if (!Utils.isNullOrEmpty(n1)) {
        if (already[n1]) {
          return;
        }
        already[n1] = true;

        res ??= [];
        res.push(n1);
      }
    });

    return res?.sort()?.filter((v1) => v1 != null);
  }, [props.config, fgListProject]);

  useEffect(() => {
    if (fgNamesUsedInConfig?.length > 0) {
      let pp = [];
      fgNamesUsedInConfig?.some((s1) => {
        pp.push(
          new Promise((resolve) => {
            REClient_.client_().describeFeatureGroupByTableName(s1, null, (err, res) => {
              resolve({ name: s1, res: res?.result });
            });
          }),
        );
      });

      Promise.all(pp).then((res) => {
        let rr = {};
        res?.some((r1) => {
          rr[r1.name] = r1.res;
        });
        setFgDescribeDict(rr);
      });
    }
  }, [fgNamesUsedInConfig]);

  const fgDictFeaturesByName: { [key: string]: { name?; dataType?; featureType?; sourceTable? }[] } = useMemo(() => {
    let res = null;

    let kk = Object.keys(fgDescribeDict ?? {});
    kk.some((k1) => {
      let v1 = fgDescribeDict[k1];
      if (v1?.schema?.length > 0) {
        res ??= {};
        res[k1] = v1?.schema;
      }
    });

    return res;
  }, [fgDescribeDict]);

  const featuresListUsedFG: { tableName?; name?; dataType?; featureType?; sourceTable? }[] = useMemo(() => {
    let res = null,
      already = {};

    let kk = Object.keys(fgDescribeDict ?? {});
    kk.some((k1) => {
      let v1 = fgDescribeDict[k1];
      if (v1?.features?.length > 0) {
        v1?.features?.some((f1) => {
          res ??= [];

          f1 = { ...(f1 ?? {}) };

          if (f1.tableName == null) {
            f1.tableName = k1;
          }

          res.push(f1);
        });
      }
    });

    return res;
  }, [fgDescribeDict]);

  const onClickAddVar = (e) => {
    let c1 = [...(props.config ?? [])];
    c1.push({
      name: '',
      value: '',
      type: ETemplatesOneTypeDefault,
      isRequired: false,
    });

    props.onChange?.(c1);
  };

  const onDeleteVar = (o1) => {
    let c1 = [...(props.config ?? [])];
    c1 = c1.filter((c0) => c0 !== o1);

    props.onDeleteConfig?.(o1);
    props.onChange?.(c1);
  };

  const calcIsMissing = (value) => {
    return props.calcIsMissing?.(value) ?? false;
  };

  useEffect(() => {
    let res = false;

    let detVars = [...(props.detectedVars ?? [])];
    props.config?.some((c1) => {
      if (_.trim(c1?.value || '') === '') {
        res = true;
      }
      if (_.trim(c1?.name || '') === '') {
        if (!props.configOri?.find((c2) => c2.value === c1.value)?.name) {
          res = true;
        }
      }
      if (calcIsMissing(c1?.value)) {
        res = true;
      }

      let v1 = _.trim(c1?.value);
      detVars = detVars.filter((v0) => _.trim(v0) !== v1);
    });

    if (!res) {
      if (detVars?.length > 0) {
        res = true;
      }
    }

    props.onIsAnyError?.(res, detVars);
  }, [props.config, props.onIsAnyError, props.detectedVars]);

  const { defaultNewValueTable, defaultNewValueColumn, defaultNewValueVar } = useMemo(() => {
    const scTable = 'featureGroup';
    const scCol = 'col';
    const scVar = 'var';

    const alreadyUsed = (num, sc) => {
      if (props.config == null) {
        return false;
      }
      return props.config?.find((c1) => c1.value?.toLowerCase() === (sc + num).toLowerCase()) != null;
    };

    let numTable = 1,
      maxTable = 999;
    while (maxTable > 0 && alreadyUsed(numTable, scTable)) {
      maxTable--;
      numTable++;
    }

    let numCol = 1,
      maxCol = 999;
    while (maxCol > 0 && alreadyUsed(numCol, scCol)) {
      maxCol--;
      numCol++;
    }

    let numVar = 1,
      maxVar = 999;
    while (maxVar > 0 && alreadyUsed(numVar, scVar)) {
      maxVar--;
      numVar++;
    }

    return { defaultNewValueTable: scTable + numTable, defaultNewValueColumn: scCol + numCol, defaultNewValueVar: scVar + numVar };
  }, [props.config]);

  const createRow = (c1: ITemplateConfigOne, c1ind: number, c1Ori: ITemplateConfigOne, isAdd = undefined, defaultNewName = undefined, useFormName = undefined) => {
    let tableNameAlreadyUsed = null;
    props.config?.some((c0) => {
      if (c0.name === c1?.name) {
        return;
      }

      tableNameAlreadyUsed ??= [];
      tableNameAlreadyUsed.push(c0.name);
    });

    return (
      <TemplateConfigEditorRow
        sqlText={props.sqlText}
        isPythonFunction={props.isPythonFunction}
        dropdownMaxChars={props.dropdownMaxChars}
        isSystemTemplate={props.isSystemTemplate}
        tableNameAlreadyUsed={tableNameAlreadyUsed}
        useFormName={props.useFormEditor ? useFormName : undefined}
        isEdit={props.isEdit}
        defaultNewValueColumn={defaultNewValueColumn}
        defaultNewValueVar={defaultNewValueVar}
        defaultNewValueTable={defaultNewValueTable}
        defaultNewName={defaultNewName}
        hideEdit={props.hideEdit}
        hideDefaultText={props.hideDefaultText}
        showDefaultWhenNullName={props.showDefaultWhenNullName}
        isInlineEdit={props.isInlineEdit}
        isAdd={isAdd}
        onChangeAll={onChangeAll.bind(null, c1)}
        isMissing={calcIsMissing(c1?.value)}
        onDelete={onDeleteVar.bind(null, c1)}
        editMode={props.editMode}
        readonly={props.readonly}
        featuresListUsedFG={featuresListUsedFG}
        fgList={fgList}
        key={'t' + c1ind}
        dataOri={c1Ori}
        data={c1}
        onChangeIsRequired={onChangeOne.bind(null, c1, 'isRequired')}
        onChangeValue={onChangeOne.bind(null, c1, 'value')}
        onChangeName={onChangeOne.bind(null, c1, true)}
        onChangeType={onChangeOne.bind(null, c1, false)}
      />
    );
  };

  const configSorted = useMemo(() => {
    if (props.isInlineEdit) {
      return props.config?.sort((a, b) => {
        if (a?.type === b?.type) {
          return 0;
        } else if (a?.type === ETemplatesOneType.TABLE) {
          return -1;
        } else if (b?.type === ETemplatesOneType.TABLE) {
          return 1;
        } else {
          return (a?.type?.toLowerCase() || '').localeCompare(b?.type?.toLowerCase() || '');
        }
      });
    } else {
      return props.config;
    }
  }, [props.config, props.isInlineEdit]);

  let content = (
    <div>
      <div
        css={`
          display: flex;
          color: white;
          padding: 10px 4px 0 8px;
          opacity: 0.8;
        `}
      >
        {!props.isInlineEdit && !props.hideEdit && (
          <div
            css={`
              width: ${editWWcolumn}px;
            `}
          >
            &nbsp;
          </div>
        )}
        <div
          css={`
            width: ${IsRequiredWW}px;
            margin-right: 10px;
          `}
        >
          <TooltipExt title={'Is Required'}>Req.</TooltipExt>
        </div>
        <div
          css={`
            flex: 3;
            margin-right: 10px;
          `}
        >
          {props.isPythonFunction ? 'Function Variable' : 'Variable Name'}
        </div>
        {showType && (
          <div
            css={`
              width: ${props.isPythonFunction ? 120 : typeWWcolumn}px;
            `}
          >
            {props.isPythonFunction ? 'Variable Type' : 'Type'}
          </div>
        )}
        <div
          css={`
            margin-left: 5px;
            flex: 7;
          `}
        >
          {props.isPythonFunction ? 'Input Feature Group' : props.editMode || props.readonly ? 'Enter value' : 'Default Value'}
        </div>
        {!(props.readonly || props.editMode) && (
          <div
            css={`
              width: ${removeWWcolumn}px;
            `}
          >
            &nbsp;
          </div>
        )}
      </div>
      {configSorted?.map((c1, c1ind) => {
        let c1Ori = c1.value == null ? null : props.configOri?.find((c0) => c0.value === c1.value);
        return createRow(c1, c1ind, c1Ori, undefined, undefined, 'int_value_' + c1ind);
      })}
      {!props.readonly && !props.editMode && (
        <div
          css={`
            margin: 7px 0;
            text-align: center;
          `}
        >
          {createRow(null, 999999, null, true, props.defaultNewName)}
        </div>
      )}
    </div>
  );

  if (props.isRelative) {
    return content;
  }

  return (
    <div
      css={`
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
      `}
    >
      <NanoScroller onlyVertical>{content}</NanoScroller>
    </div>
  );
});

export default TemplateConfigEditor;
