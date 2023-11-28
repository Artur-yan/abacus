import Checkbox from 'antd/lib/checkbox';
import Input from 'antd/lib/input';
import InputNumber from 'antd/lib/input-number';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useState, useRef } from 'react';
import { Provider } from 'react-redux';
import Utils from '../../../core/Utils';
import { useFeatureGroupsAll } from '../../api/REUses';
import { PythonFunctionArgumentInitialValues, PythonFunctionArgumentTypes, PythonFunctionConfig, PythonFunctionConfigItem } from '../../stores/reducers/templates';
import SelectExt from '../SelectExt/SelectExt';
import TooltipExt from '../TooltipExt/TooltipExt';
import { Button } from 'antd';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as uuid from 'uuid';
import REClient_ from '../../api/REClient';

const styles = require('./PythonFunctionConfigEditor.module.css');
const sd = require('../antdUseDark.module.css');
interface PythonFunctionConfigEditorRowProps {
  configItem?: PythonFunctionConfigItem;
  onChange?: (item: PythonFunctionConfigItem) => void;
  featureGroupList?: any[];
  dropdownMaxChars?: number;
  allowAdd?: boolean;
  onDelete?: (index: string) => void;
  pythonFunctionArgumentTypes?: any[];
  error?: boolean;
  refreshTemplate?: () => void;
}

const newConfigItem = (argTypes) => ({ index: uuid.v1(), name: '', type: null, validTypes: argTypes, isRequired: false, value: null } as PythonFunctionConfigItem);
const booleanOptions = [
  { label: 'true', value: true },
  { label: 'false', value: false },
];

const PythonFunctionConfigEditorRow = React.memo((props: PropsWithChildren<PythonFunctionConfigEditorRowProps>) => {
  const typeOptions = props.configItem?.validTypes?.map((type) => ({ label: type, value: type })) || [];
  const typeValue = typeOptions.find((item) => item?.label === props?.configItem?.type);
  const booleanValue = booleanOptions.find((item) => item?.value === props?.configItem?.value) || null;
  const dropdownValue = props?.featureGroupList?.find?.((featureGroup) => featureGroup.label === props.configItem?.value);

  const showValueDropdown = props.configItem?.type === PythonFunctionArgumentTypes.FEATURE_GROUP;
  const showInputNumber = !showValueDropdown && [PythonFunctionArgumentTypes.INTEGER, PythonFunctionArgumentTypes.FLOAT].includes(props?.configItem?.type);
  const showBooleanDropdown = !showValueDropdown && !showInputNumber && props.configItem?.type === PythonFunctionArgumentTypes.BOOLEAN;
  const showInput = !showValueDropdown && !showInputNumber && !showBooleanDropdown;

  let value = props.configItem?.value;
  if (props.configItem?.type === PythonFunctionArgumentTypes.JSON && typeof value === 'object') {
    value = JSON.stringify(value);
  }

  const onChangeValueInputNumber = (value) => {
    props.onChange({ ...props?.configItem, value });
  };

  const onChangeValueInput = (e) => {
    props.onChange({ ...props?.configItem, value: e?.target?.value });
  };

  const onChangeValueDropdown = (option) => {
    props.onChange({ ...props?.configItem, value: option?.label });
  };
  const onChangeBooleanDropdown = (option) => {
    props.onChange({ ...props?.configItem, value: option?.value });
  };

  const onChangeType = (option) => {
    props.onChange({
      ...props?.configItem,
      type: option?.value,
      value: PythonFunctionArgumentInitialValues[option?.value],
    });
  };

  return (
    <div className={styles.divTableRow}>
      <div className={classNames(styles.divTableCol, styles.required)}>
        <Checkbox
          disabled={!props.allowAdd}
          css={`
            margin-right: 10px;
            width: 20px;
            margin-top: 3px;
          `}
          checked={props.configItem?.isRequired}
          onChange={(e) => props?.onChange({ ...props?.configItem, isRequired: e?.target?.checked })}
        />
      </div>
      <div className={classNames(styles.divTableCol, styles.argName)}>
        {props.allowAdd ? <Input value={props.configItem?.name} onChange={(e) => props?.onChange({ ...props?.configItem, name: e?.target?.value })} className={styles.argInput} /> : <div>{props.configItem?.name}</div>}
      </div>
      <div className={classNames(styles.divTableCol, styles.type)}>
        <SelectExt
          css={`
            width: 100%;
            margin-right: 10px;
          `}
          value={typeValue}
          options={typeOptions}
          onChange={onChangeType}
        />
      </div>
      <div className={classNames(styles.divTableCol, styles.value)}>
        {showValueDropdown && (
          <SelectExt
            css={`
              width: 100%;
            `}
            value={dropdownValue}
            options={props?.featureGroupList}
            onChange={onChangeValueDropdown}
            showTooltips
          />
        )}
        {showInputNumber && (
          <InputNumber
            css={`
              width: 100%;
            `}
            disabled={!props?.configItem?.type}
            value={props?.configItem?.type && props.configItem?.value}
            onChange={onChangeValueInputNumber}
          />
        )}
        {showBooleanDropdown && (
          <SelectExt
            css={`
              width: 100%;
            `}
            value={booleanValue}
            options={booleanOptions}
            onChange={onChangeBooleanDropdown}
            showTooltips
          />
        )}
        {showInput && (
          <Input
            css={`
              width: 100%;
            `}
            value={props.configItem?.value as string}
            onChange={onChangeValueInput}
          />
        )}
      </div>
      {props.allowAdd && (
        <div
          className={classNames(styles.divTableCol, styles.delete)}
          css={`
            padding-top: 6px;
            cursor: pointer;
          `}
        >
          <FontAwesomeIcon onClick={() => props?.onDelete(props?.configItem?.index)} color="red" icon={require('@fortawesome/pro-duotone-svg-icons/faTrash').faTrash} />
        </div>
      )}
      {(props.error || !props.configItem?.name || !typeValue) && (
        <div
          css={`
            font-size: 13px;
            margin: 3px 0;
            color: red;
            clear: both;
            text-align: center;
          `}
        >
          Argument missing required info
        </div>
      )}
    </div>
  );
});

interface PythonFunctionConfigEditorProps {
  featureGroupId?: string;
  config?: PythonFunctionConfig;
  onChange?: (newValue: PythonFunctionConfig) => void;
  editMode?: boolean;
  dropdownMaxChars?: number;
  allowAdd?: boolean;
  onAdd?: () => void;
  refreshTemplateOnArgChange?: (args: any[]) => void;
}

const PythonFunctionConfigEditor = React.memo((props: PropsWithChildren<PythonFunctionConfigEditorProps>) => {
  const [config, setConfig] = useState(props?.config || []);
  const pythonFunctionArgumentTypes = useRef([]);
  const invalidPythonFunctionArguments = useRef([]);
  useEffect(() => {
    setConfig(props?.config);
  }, [props?.config]);

  useEffect(() => {
    const fetchArgumentTypes = async () => {
      const response = await REClient_.promises_()._listSupportedPythonFunctionArgumentTypes();
      if (response?.success) {
        pythonFunctionArgumentTypes.current = response?.result || [];
      }
    };

    fetchArgumentTypes();
  }, []);

  const checkIfArgIsNotValid = (arg) => (arg?.isRequired ? !arg?.name || !arg?.type || arg?.value === '' || arg?.value === null : !arg?.name || !arg?.type);

  const onChangeConfigItem = (newItem) => {
    const isNotValidArg = checkIfArgIsNotValid(newItem);
    const index = props?.allowAdd ? _.findIndex(config, (arg) => arg?.index === newItem?.index) : _.findIndex(config, (o1) => o1.name === newItem.name);

    const newConfig = [...config?.slice(0, index), newItem, ...config?.slice(index + 1)];
    setConfig(newConfig);
    props?.onChange?.(newConfig);

    if (!isNotValidArg) {
      props?.refreshTemplateOnArgChange?.(newConfig);
      invalidPythonFunctionArguments.current = invalidPythonFunctionArguments.current.filter((item) => item !== newItem?.index);
    } else if (!invalidPythonFunctionArguments.current.includes(newItem?.index)) {
      invalidPythonFunctionArguments.current = [...invalidPythonFunctionArguments.current, newItem?.index];
    }
  };

  const deleteArg = (deleteIndex) => {
    invalidPythonFunctionArguments.current = invalidPythonFunctionArguments.current.filter((item) => item !== deleteIndex);
    const updatedArgs = config?.filter((arg) => arg?.index !== deleteIndex);
    setConfig(updatedArgs);
    props?.onChange?.(updatedArgs);
  };

  let featureGroupList = useFeatureGroupsAll();

  featureGroupList = useMemo(() => {
    let list = featureGroupList?.map?.((featureGroup) => ({ label: featureGroup?.name, value: featureGroup?.featureGroupId, tooltipShow: featureGroup?.name })) || [];
    list = list?.filter?.((featureGroup) => featureGroup.value !== props.featureGroupId);
    list?.unshift?.({ label: '(None)', value: null });
    return list;
  }, [featureGroupList, props.featureGroupId]);

  const onAdd = () => {
    const allowedToAdd = config?.every?.((arg) => !checkIfArgIsNotValid(arg));

    if (invalidPythonFunctionArguments.current.length === 0 && allowedToAdd) {
      setConfig([...config, newConfigItem(pythonFunctionArgumentTypes.current)]);
    }
  };

  // TODO(rohan): its better to use a table here
  return (
    <Provider store={Utils.globalStore()}>
      <div className={styles.divTable}>
        <div className={styles.divTableRow}>
          <div className={classNames(styles.divTableCol, styles.required)}>
            <TooltipExt title={'Is Required'}>Req.</TooltipExt>
          </div>
          <div className={classNames(styles.divTableCol, styles.argName)}>Function Variable</div>
          <div className={classNames(styles.divTableCol, styles.type)}>Variable Type</div>
          <div className={classNames(styles.divTableCol, styles.value)}>Value</div>
        </div>
        {config?.map((configItem, index) => {
          return (
            <PythonFunctionConfigEditorRow
              key={'t' + index}
              featureGroupList={featureGroupList}
              dropdownMaxChars={props.dropdownMaxChars}
              configItem={configItem}
              onChange={onChangeConfigItem}
              allowAdd={props?.allowAdd}
              onDelete={deleteArg}
              pythonFunctionArgumentTypes={pythonFunctionArgumentTypes.current}
              error={invalidPythonFunctionArguments.current.includes(configItem?.index)}
            />
          );
        })}
      </div>
      {props?.allowAdd && (
        <Button
          css={`
            padding-left: 5px;
          `}
          onClick={onAdd}
          type="link"
        >
          {' '}
          +Add Argument
        </Button>
      )}
    </Provider>
  );
});

export default React.memo(PythonFunctionConfigEditor);
