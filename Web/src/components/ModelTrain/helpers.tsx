import React, { CSSProperties } from 'react';
import HelpIcon from '../HelpIcon/HelpIcon';
import $ from 'jquery';
import _ from 'lodash';
import TagsSelectExt from '../TagsSelectExt/TagsSelectExt';
import MultiEnumComp from '../MultiEnumComp/MultiEnumComp';
import moment from 'moment';
import { Button, Collapse, DatePicker, Form, Input, InputNumber, Radio } from 'antd';
import Utils from '../../../core/Utils';
import EditorElem from '../EditorElem/EditorElem';
import OptionMultiDropdown from '../OptionMultiDropdown/OptionMultiDropdown';
import SelectExt from '../SelectExt/SelectExt';
const sd = require('../antdUseDark.module.css');
const { Panel } = Collapse;

export const booleanAutoValue = 'CONST__BOOLEAN__AUTO__001';
export const groupSep = '___#¢#¢#___';

export const buildOptionInput: (
  allOptions,
  o,
  o1ind,
  onChangeForm,
  calcTip: (name) => any,
  projectId?,
  formRef?,
  oPre?,
  isSecondInRow?,
  forceRefresh?,
  helpIdPrefix?,
  onNeedsRefreshInputChange?,
  problemType?,
  formItemName?,
) => { list; initialValues } = (allOptions, o, o1ind, onChangeForm?, calcTip?, projectId?, formRef?, oPre?, isSecondInRow?, forceRefresh?, helpIdPrefix?, onNeedsRefreshInputChange?, problemType?, formItemName?) => {
  const calcNameO = (o) => {
    if (o == null) {
      return null;
    }

    const dataType1 = o.dataType?.toUpperCase();

    let inputName = o.name;
    if (dataType1 == 'MULTI_ENUM') {
      inputName = o.name + '_CUSTOMENUM';
    }

    if (o.inputName) {
      inputName = o.inputName;
    }

    let nameShow = name;
    if (o.nameShow) {
      nameShow = o.nameShow;
    }

    let groupName = null;
    if (o.groupName) {
      inputName = o.groupName + groupSep + inputName;
    }
    return formItemName ? [formItemName, inputName] : inputName;
  };

  let input = null,
    createAuto = false,
    inputName = '',
    inputInitialValue = null;
  let name = o.name
    ?.toLowerCase()
    .split('_')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ''))
    .join(' ');
  let prefix_help_id = (helpIdPrefix == null ? '' : helpIdPrefix + '_') + 'trainoption_' + (o.description != null && o.description !== '' ? '' : '2_') + (o.groupName || '') + o.name;
  if (o.name === 'TYPE_OF_SPLIT') {
    prefix_help_id = `${prefix_help_id}_${problemType}`;
  }

  let help_icon = (
    <span style={{ marginLeft: '5px' }}>
      <HelpIcon id={o.helpId || prefix_help_id || ''} />
    </span>
  );
  let popupContainerForMenu = (node) => document.getElementById('body2');
  const onInputChange = (e) => (o.needsRefresh ? onNeedsRefreshInputChange?.(e, inputName) : onChangeForm?.(e));

  let ruleCustom,
    ignoreRuleRequired = false;
  const dataType1 = o.dataType?.toUpperCase();

  //
  let isVisible = o?.options?.isVisible as { [key: string]: any[] | any };
  let isHidden = o?.options?.isHidden as { [key: string]: any[] | any };
  let isEnabled = o?.options?.isEnabled as { [key: string]: any[] | any };
  let isDisabled = o?.options?.isDisabled as { [key: string]: any[] | any };

  const oIsEqual = (v1, v2) => {
    if (v1 == null && v2 == null) {
      return true;
    } else {
      return v1 === v2;
    }
  };

  const calcValueFromForm = (o0) => {
    let formValue = formRef?.current?.getFieldValue(calcNameO(o0));
    if (formValue?.value != null) {
      return formValue?.value;
    } else {
      return formValue;
    }
  };

  let shouldShow = true;
  if (isVisible != null && !_.isEmpty(isVisible)) {
    Object.keys(isVisible).some((k1) => {
      let vv = isVisible[k1];

      if (!_.isArray(vv)) {
        vv = [vv];
      }

      vv?.some((v1) => {
        let o0 = allOptions?.find((o1) => o1?.name === k1 || o1?.searchKey === k1);
        if (o0 == null) {
          return;
        }
        let formValue = calcValueFromForm(o0);
        let isIn = false;
        vv?.some((v0) => {
          if (oIsEqual(v0, formValue)) {
            isIn = true;
            return true;
          }
        });
        if (!isIn) {
          shouldShow = false;
        }
      });
    });
  }
  if (isHidden != null && !_.isEmpty(isHidden)) {
    Object.keys(isHidden).some((k1) => {
      let vv = isHidden[k1];

      if (!_.isArray(vv)) {
        vv = [vv];
      }

      vv?.some((v1) => {
        let o0 = allOptions?.find((o1) => o1?.name === k1 || o1?.searchKey === k1);
        if (o0 == null) {
          return;
        }
        let formValue = calcValueFromForm(o0);
        let isIn = false;
        vv?.some((v0) => {
          if (oIsEqual(v0, formValue)) {
            isIn = true;
            return true;
          }
        });
        if (isIn) {
          shouldShow = false;
        }
      });
    });
  }

  let shouldEnable = true;
  if (isEnabled != null && !_.isEmpty(isEnabled)) {
    Object.keys(isEnabled).some((k1) => {
      let vv = isEnabled[k1];

      if (!_.isArray(vv)) {
        vv = [vv];
      }

      vv?.some((v1) => {
        let o0 = allOptions?.find((o1) => o1?.name === k1 || o1?.searchKey === k1);
        if (o0 == null) {
          return;
        }
        let formValue = calcValueFromForm(o0);
        let isIn = false;
        vv?.some((v0) => {
          if (oIsEqual(v0, formValue)) {
            isIn = true;
            return true;
          }
        });
        if (!isIn) {
          shouldEnable = false;
        }
      });
    });
  }
  if (isDisabled != null && !_.isEmpty(isDisabled)) {
    Object.keys(isDisabled).some((k1) => {
      let vv = isDisabled[k1];

      if (!_.isArray(vv)) {
        vv = [vv];
      }

      vv?.some((v1) => {
        let o0 = allOptions?.find((o1) => o1?.name === k1 || o1?.searchKey === k1);
        if (o0 == null) {
          return;
        }
        let formValue = calcValueFromForm(o0);
        let isIn = false;
        vv?.some((v0) => {
          if (oIsEqual(v0, formValue)) {
            isIn = true;
            return true;
          }
        });
        if (isIn) {
          shouldEnable = false;
        }
      });
    });
  }
  //

  if (dataType1 === 'ENUM_TAGS' || dataType1 === 'LIST') {
    let isCustom = false;
    if (dataType1 === 'LIST') {
      isCustom = true;
    }
    inputInitialValue = o.lastModelValue == undefined ? o.current ?? o.default : o.lastModelValue;
    inputName = o.name;
    let options1 = [];
    o.options?.names?.some((o1, o1ind) => {
      let isDisabled = o.options?.disabled ? o.options?.disabled?.indexOf(o1) > -1 : false;
      options1.push({ label: '' + o.options?.names?.[o1ind], isDisabled, value: o.options?.values[o1ind] });
    });
    input = (
      <TagsSelectExt
        onChange={onInputChange}
        disabled={!shouldEnable}
        customNumberMin={o.options?.range?.[0]}
        customNumberMax={o.options?.range?.[1]}
        customTypeIsString={(o.options?.list_data_type ?? o.options?.listDataType)?.toUpperCase() === 'STRING'}
        customNumberDecimals={o.options?.decimals ?? 0}
        isCustom={isCustom}
        addName={o.options?.addName}
        options={options1}
        staticNames={o.options?.staticNames}
        itemIdForProjectId={o.options?.showItemId ? projectId : null}
      />
    );
  } else if (dataType1 == 'MULTI_ENUM') {
    inputInitialValue = o.lastModelValue == undefined ? o.current ?? o.default : o.lastModelValue;
    inputName = o.name + '_CUSTOMENUM';
    input = <MultiEnumComp disabled={!shouldEnable} o={o} formRef={formRef} />;
  } else if (dataType1 == 'DATETIME') {
    const tzOffset = moment().utcOffset();

    inputInitialValue = o.lastModelValue == undefined ? o.current ?? o.default : o.lastModelValue;
    if (inputInitialValue != null) {
      inputInitialValue = moment(inputInitialValue).utcOffset(tzOffset);
    }

    let min = null,
      max = null;
    if (o.options?.range != null) {
      min = o.options.range[0];
      max = o.options.range[1];

      if (min != null) {
        min = moment(min).utcOffset(tzOffset);
      }
      if (max != null) {
        max = moment(max).utcOffset(tzOffset);
      }
    }
    const disabledDate = (dt) => {
      if (min != null) {
        if (dt.isBefore(min)) {
          return true;
        }
      }
      if (max != null) {
        if (dt.isAfter(max)) {
          return true;
        }
      }

      return false;
    };

    inputName = o.name;
    const allowMinutes: any = o.showTime === true;

    input = (
      <DatePicker
        placeholder={o.placeholder}
        disabled={!shouldEnable}
        style={{ width: '100%' }}
        format={allowMinutes ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD'}
        showTime={{ defaultValue: moment('00:00:00', 'HH:mm:ss') }}
        disabledDate={disabledDate}
        allowClear={true}
      />
    );
  } else if (dataType1 == 'BOOLEAN') {
    createAuto = true;
    inputInitialValue = o.lastModelValue == undefined ? o.current ?? o.default : o.lastModelValue;
    let showAutomaticForBoolean = o.options?.showAutomaticForBoolean === true;
    if (inputInitialValue == undefined) {
      inputInitialValue = showAutomaticForBoolean ? booleanAutoValue : null;
    }
    inputName = o.name;
    input = (
      <Radio.Group defaultValue={inputInitialValue} onChange={onInputChange} disabled={!shouldEnable} style={{ marginTop: '1px' }}>
        <Radio value={true} style={{ color: Utils.colorA(1) }}>
          Yes
        </Radio>
        <Radio value={false} style={{ color: Utils.colorA(1) }}>
          No
        </Radio>
        {showAutomaticForBoolean && (
          <Radio value={booleanAutoValue} style={{ color: Utils.colorA(1) }}>
            Auto
          </Radio>
        )}
      </Radio.Group>
    );
  } else if (dataType1 == 'RADIOS') {
    createAuto = false;
    inputInitialValue = o.lastModelValue == undefined ? o.current ?? o.default : o.lastModelValue;
    inputName = o.name;
    input = (
      <Radio.Group defaultValue={inputInitialValue} onChange={onInputChange} disabled={!shouldEnable} style={{ marginTop: '1px' }}>
        {o?.options?.values?.map((v1, v1ind) => {
          return (
            <Radio value={v1 ?? o?.options?.names?.[v1ind]} style={{ color: Utils.colorA(1) }}>
              {o?.options?.names?.[v1ind] ?? v1 ?? '-'}
            </Radio>
          );
        })}
      </Radio.Group>
    );
  } else if (dataType1 == 'INTEGER') {
    inputInitialValue = o.lastModelValue == undefined ? o.current ?? o.default ?? null : o.lastModelValue;
    inputName = o.name;
    createAuto = !o.required && o.default == undefined;
    let width = o?.options?.width ?? '100%';
    let units = o?.options?.units ?? null;
    input = (
      <InputNumber
        placeholder={o.placeholder}
        disabled={!shouldEnable}
        onChange={onChangeForm}
        min={o.options?.range?.[0]}
        max={o.options?.range?.[1]}
        step={o.options?.step}
        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
        parser={(value) => value.replace(/(,*)/g, '')}
        precision={0}
        style={{ width: width }}
        addonAfter={units}
      />
    );
  } else if (dataType1 == 'DECIMAL') {
    inputInitialValue = o.lastModelValue == undefined ? o.current ?? o.default ?? null : o.lastModelValue;
    inputName = o.name;
    createAuto = !o.required && o.default == undefined;
    input = <InputNumber placeholder={o.placeholder} disabled={!shouldEnable} onChange={onChangeForm} min={o.options?.range?.[0]} max={o.options?.range?.[1]} step={o.options?.step ?? 0.01} style={{ width: '100%' }} />;
  } else if (dataType1 == 'JSON') {
    ignoreRuleRequired = true;
    inputInitialValue = o.lastModelValue == undefined ? (o.current ?? o.default) || '' : o.lastModelValue;
    inputName = o.name;
    input = <EditorElem readonly={!shouldEnable} lang={'json'} useInternal hideExpandFull height={o.options?.height ?? 170} />;
    ruleCustom = ({ getFieldValue }) => ({
      validator(rule, value) {
        if (!value && !o.required) {
          return Promise.resolve();
        }
        if (o.required && _.trim((value || '').replace(/[\n\r\t ]/gi, '')) === '') {
          return Promise.reject('Required!');
        }
        let json1 = Utils.tryJsonParse(value);
        if (json1 == null) {
          return Promise.reject('Invalid JSON');
        }
        return Promise.resolve();
      },
    });
  } else if (dataType1 == 'STRING') {
    inputInitialValue = o.lastModelValue == undefined ? (o.current ?? o.default) || '' : o.lastModelValue;
    inputName = o.name;
    input = <Input placeholder={o.placeholder} disabled={!shouldEnable} style={{ width: '100%' }} />;
  } else if (dataType1 == 'MULTI_DROPDOWN') {
    inputInitialValue = o.lastModelValue == undefined ? (o.current ?? o.default) || null : o.lastModelValue;
    inputName = o.name;
    input = <OptionMultiDropdown disabled={!shouldEnable} data={o.options?.dropdowns} titleWidth={o.options?.titleWidth} primaryKey={o.options?.primaryKey} />;
  } else if (dataType1 == 'ENUM') {
    let autoVal = {
      value: 'AUTO',
      label: 'Automatic',
      name: 'Automatic',
    };
    if (o.no_auto === true || o.noAuto === true) {
      autoVal.value = null;
      autoVal.label = '(None)';
      autoVal.name = '(None)';
    }

    const options = o.options.values?.map((val, o1ind) => {
      return {
        value: val,
        label: o.options.names == null ? val : o.options.names[o1ind],
        name: val,
      };
    });
    if (o.default == undefined) {
      options?.unshift(autoVal);
    }
    let initVal = o.lastModelValue == undefined ? o.current ?? o.default : o.lastModelValue;
    let selOption = initVal == null ? autoVal : options?.find((o1) => o1.value === initVal);
    if (selOption == null) {
      selOption = autoVal;
    }

    inputInitialValue = selOption;
    inputName = o.name;
    input = <SelectExt onChange={onInputChange} placeholder={o.placeholder} isDisabled={!shouldEnable} style={{ fontWeight: 400, color: Utils.colorA(1) }} options={options} menuPortalTarget={popupContainerForMenu(null)} />;
  } else if (dataType1 == 'CONSTANT') {
    input = (
      <div
        css={`
          font-family: Roboto;
          font-size: 12px;
          font-weight: bold;
          letter-spacing: 1.12px;
          color: #ffffff;
          margin-top: -4px;
          margin-bottom: 8px;
          opacity: 0.8;
        `}
      >
        {o.default ?? ''}
      </div>
    );
  }

  let tip1 = calcTip?.(o.name);

  if (createAuto) {
    if (o.no_auto === true || o.noAuto === true) {
      createAuto = false;
    }
  }

  let rules = null;
  if (o.required && !createAuto && !ignoreRuleRequired) {
    rules = [{ required: true, message: 'Required!' }];
  }
  if (ruleCustom != null) {
    rules = rules ?? [];
    rules.push(ruleCustom);
  }

  //
  inputName = calcNameO(o);

  let nameShow = name;
  if (o.nameShow) {
    nameShow = o.nameShow;
  }

  let styleItem: CSSProperties = {};
  let groupName = null;
  if (o.groupName) {
    if (oPre == null || oPre?.groupName !== o.groupName) {
      groupName = o.groupName + ': ';
    }
    if (!isSecondInRow) {
      styleItem.marginLeft = '20px';
    }
  }

  let initialValues = {};

  let resG = null;
  if (o.groupName && (!isSecondInRow || groupName)) {
    resG = (
      <div
        css={`
          text-transform: uppercase;
          font-family: Roboto;
          font-size: 12px;
          font-weight: bold;
          letter-spacing: 1.12px;
          color: #ffffff;
          margin-bottom: 8px;
        `}
      >
        {isSecondInRow ? null : groupName}&nbsp;
      </div>
    );
  }

  let shortDesc = null;
  if (!Utils.isNullOrEmpty(o?.shortDescription)) {
    shortDesc = (
      <div
        style={{ display: shouldShow ? 'block' : 'none' }}
        css={`
          margin-bottom: 18px;
          font-family: Matter;
          font-size: 12px;
          color: #d1e4f5;
          margin-top: 7px;
        `}
      >
        {o?.shortDescription}
      </div>
    );
  }

  if (inputName && inputInitialValue != null) {
    const tempInputName = _.isArray(inputName) ? inputName.join('_') : inputName;
    initialValues[tempInputName] = inputInitialValue;
  }
  if (createAuto || shortDesc != null) {
    styleItem.marginBottom = '4px';
  }

  if (!shouldShow) {
    styleItem.display = 'none';
  }
  if (inputName && o?.clearDefault) {
    const tempInputName = _.isArray(inputName) ? inputName.join('_') : inputName;
    initialValues[tempInputName] = undefined;
  }

  let formItemLabel =
    o?.options?.showLabel !== false ? (
      <span css={(o?.options?.maintainTitleCase ? `` : `{text-transform: uppercase;}`) + `font-family: Roboto; font-size: 12px; font-weight: bold; letter-spacing: 1.12px; color: #ffffff;`}>
        {nameShow}
        {help_icon}
      </span>
    ) : null;
  let res = (
    <Form.Item style={styleItem} className={sd.darkdate} rules={rules} name={inputName} key={'form_item_' + o1ind} label={formItemLabel}>
      {input}
    </Form.Item>
  );

  if (tip1 != null && !shouldShow) {
    tip1 = null;
  }

  if (createAuto) {
    // const name2 = inputName+'_auto';
    // initialValues[name2] = o.lastModelValue == undefined;
    let res2 = (
      <div key={'clear' + inputName} style={{ display: shouldShow ? 'block' : 'none' }}>
        <Button
          disabled={!shouldEnable}
          onClick={() => {
            let v1 = { [inputName]: null };
            formRef?.current?.setFieldsValue(v1);
            onChangeForm?.(v1);
            forceRefresh?.();

            $('.clearButton.' + inputName).css({
              opacity: 0.1,
            });
          }}
          className={'clearButton ' + inputName}
          css={`
            opacity: 0.1;
            border-color: rgba(255, 255, 255, 0.6);
            border-radius: 3px;
            font-size: 13px;
          `}
          type={'default'}
          ghost
          size={'small'}
        >
          Clear
        </Button>
      </div>
    );

    return { list: [resG, res, res2, shortDesc, tip1].filter((f1) => f1 != null), initialValues };
  } else {
    return { list: [resG, res, shortDesc, tip1].filter((f1) => f1 != null), initialValues };
  }
};

export const getAdvancedTrainingOptionsList = (optionsList, initialValuesRes, onChangeForm, calcTip1, projectId, formRef, formForceRefresh, onNeedsRefreshInputChange, problemType, formItemName?) => {
  let advancedTrainingOptionsList = prepareBuildOptions(optionsList);

  initialValuesRes = initialValuesRes ?? {};
  let listAdv = [],
    allO = [],
    listAdvIn = [],
    listAdvInName = null;
  for (let i = 0; i < advancedTrainingOptionsList.length; i++) {
    const o1 = advancedTrainingOptionsList[i];
    const o2 = advancedTrainingOptionsList[i + 1];
    const o0 = advancedTrainingOptionsList[i - 1];

    let newLine = o2?.options?.newLine === true || o1?.options?.oneColumn === true || o1?.dataType?.toUpperCase() === 'JSON' || o2?.newLine === true;
    if (o2 != null && o1?.groupName !== o2?.groupName) {
      newLine = true;
    }

    if (o1?.groupGlobal !== o2?.groupGlobal) {
      newLine = true;
    }

    let newGroupGlobal = false;
    if (o0 != null && o0?.groupGlobal !== o1?.groupGlobal) {
      newGroupGlobal = true;
    }
    if (o0 == null) {
      newGroupGlobal = true;
    }

    if (newGroupGlobal) {
      if (listAdvIn.length > 0) {
        listAdv.push({ list: listAdvIn, name: listAdvInName });
      }
      listAdvIn = [];
    }

    let b1 = o1 == null ? null : buildOptionInput(advancedTrainingOptionsList, o1, i, onChangeForm, calcTip1, projectId, formRef, o0, false, formForceRefresh, undefined, onNeedsRefreshInputChange, problemType, formItemName);
    let b2 = newLine || o2 == null ? null : buildOptionInput(advancedTrainingOptionsList, o2, i + 1, onChangeForm, calcTip1, projectId, formRef, o1, false, formForceRefresh, undefined, onNeedsRefreshInputChange, problemType, formItemName);
    if (b1 != null && b2 != null) {
      allO.push(b1);
      allO.push(b2);

      listAdvIn.push(
        <div
          key={'opt_' + o1.name + o2?.name}
          css={`
            display: flex;
            flex-wrap: nowrap;
            margin-bottom: 12px;
          `}
        >
          <div
            css={`
              flex: 1;
              margin-right: 9px;
            `}
          >
            {b1.list}
          </div>
          <div
            css={`
              flex: 1;
              margin-left: 9px;
            `}
          >
            {b2.list}
          </div>
        </div>,
      );

      i++;
    } else if (b1 != null) {
      allO.push(b1);
      listAdvIn = listAdvIn.concat(b1.list);
    }

    listAdvInName = o1?.groupGlobal;
  }

  if (listAdvIn.length > 0) {
    if (listAdv[listAdv.length - 1]?.list !== listAdvIn) {
      listAdv.push({ list: listAdvIn, name: listAdvInName });
    }
  }

  advancedTrainingOptionsList = listAdv.map((l1, ind1) => {
    if (Utils.isNullOrEmpty(l1.name)) {
      return (
        <div
          key={'opt_222_' + ind1}
          css={`
            position: relative;
            border-top: 1px solid ${Utils.colorA(0.2)};
            padding-top: 12px;
            margin-top: 6px;
          `}
        >
          {l1.list}
        </div>
      );
    } else {
      return (
        <div
          key={'opt_2_' + l1.name}
          css={`
            position: relative;
            border-top: 1px solid ${Utils.colorA(0.2)};
            padding-top: 12px;
            margin-top: 6px;
          `}
        >
          {/*// @ts-ignore*/}
          <Collapse bordered={true} style={{ backgroundColor: 'transparent', borderColor: '#23305e', color: 'white', marginTop: '10px' }}>
            {/*// @ts-ignore*/}
            <Panel
              header={l1.name}
              forceRender={true}
              style={{ borderColor: '#23305e', backgroundColor: '#23305e', fontFamily: 'Roboto', fontSize: '12px', fontWeight: 500 }}
              css={`
                .ant-collapse-content.ant-collapse-content-active {
                  background-color: #20252c !important;
                  border-top-width: 0 !important;
                }
              `}
            >
              {l1.list}
            </Panel>
          </Collapse>
        </div>
      );
    }
  });
  allO.some((o1) => {
    initialValuesRes = _.assign({}, initialValuesRes, o1.initialValues ?? {});
  });

  return { advancedTrainingOptionsList, initialValuesRes };
};

export const optionsOnValuesChange = (changedValues, values, form) => {
  let cc = Object.keys(changedValues);
  cc.some((c1) => {
    let v1 = values[c1];

    let $clear1 = $('.clearButton.' + c1);
    if (v1 == null || v1 === '') {
      if ($clear1.css('opacity') !== '0.1') {
        $clear1.css({
          opacity: 0.1,
        });
      }
    } else {
      if ($clear1.css('opacity') !== '1') {
        $clear1.css({
          opacity: 1,
        });
      }
    }
  });
};

export const prepareBuildOptions = (list) => {
  if (list == null) {
    return list;
  }

  list = [...list];

  const anyGroupGlobal = list.find((o1) => !Utils.isNullOrEmpty(o1.groupGlobal)) != null;

  let res = [];
  if (anyGroupGlobal) {
    for (let i = 0; i < list.length; i++) {
      let o1 = list[i];

      if (!Utils.isNullOrEmpty(o1.groupGlobal)) {
        let moveItems = [];
        for (let j = i + 1; j < list.length; j++) {
          if (o1.groupGlobal === list[j]?.groupGlobal) {
            //
            let v1 = list.splice(j, 1)?.[0];
            moveItems.push(v1);

            j--;
          }
        }

        if (moveItems.length > 0) {
          list.splice(i + 1, 0, ...moveItems);

          i += moveItems.length;
        }
      }
    }
  }

  list.some((o1, o1ind) => {
    if (o1.dataType === 'DICT_VALUES') {
      let o2: any = {
        groupGlobal: o1.groupGlobal,
        groupName: o1.name,
        dataType: o1.valueType,
        options: o1.valueOptions,
        description: o1.description,
        advanced: o1.advanced,
        noAuto: o1.noAuto == null || o1.noAuto === true,
      };
      o1.options?.names?.some((n1, n1ind) => {
        let v1 = o1.options?.values?.[n1ind] ?? n1;
        let o3 = _.assign({}, o2, {
          nameShow: n1,
          name: v1,
        });
        res.push(o3);
      });
    } else {
      res.push(o1);
    }
  });
  return res;
};
