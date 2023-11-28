import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import InputNumber from 'antd/lib/input-number';
import * as React from 'react';
import { PropsWithChildren, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./EditNumberSpan.module.css');
const sd = require('../antdUseDark.module.css');

interface IEditNumberSpanProps {
  value?: any;
  onChange?: (value: any) => void;
  onNullShow?: any;
  onZeroShow?: any;
  min?: number;
  max?: number;
  allowClear?: boolean;
  suffix?: string;
  step?: number;
}

const EditNumberSpan = React.memo((props: PropsWithChildren<IEditNumberSpanProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const [value, setValue] = useState(props.value);
  const [isEditing, setIsEditing] = useState(false);

  const onClickEdit = (e) => {
    if (value == null || (value === 0 && props.min > value)) {
      if (props.min) {
        setValue(props.min);
      }
    }
    setIsEditing(true);
  };

  const onClickCancel = (e) => {
    setValue(props.value);
    setIsEditing(false);
  };

  const onClickSet = (e) => {
    props.onChange?.(value);
    setIsEditing(false);
  };

  const onClickClear = (e) => {
    setValue(null);

    props.onChange?.(null);
    setIsEditing(false);
  };

  const onClickChangeNumber = (v1) => {
    setValue(v1);
  };

  let valueShow = value;
  if (valueShow === 0) {
    valueShow = props.onZeroShow;
  } else if (valueShow == null) {
    valueShow = props.onNullShow;
  }

  return (
    <span>
      {isEditing && (
        <InputNumber
          step={props.step ?? 1}
          onChange={onClickChangeNumber}
          value={value}
          css={`
            width: 90px;
          `}
          min={props.min}
          max={props.max}
        />
      )}
      {isEditing && (
        <Button
          onClick={onClickSet}
          css={`
            margin-left: 8px;
          `}
          size={'small'}
          type={'primary'}
        >
          Set
        </Button>
      )}
      {isEditing && (
        <Button
          onClick={onClickCancel}
          css={`
            margin-left: 8px;
          `}
          size={'small'}
          type={'primary'}
        >
          Cancel
        </Button>
      )}
      {props.allowClear && isEditing && (
        <Button
          onClick={onClickClear}
          css={`
            margin-left: 8px;
          `}
          size={'small'}
          type={'default'}
        >
          Clear
        </Button>
      )}

      {!isEditing && <span>{valueShow}</span>}
      {!isEditing && (
        <span
          onClick={onClickEdit}
          css={`
            margin-left: 6px;
            opacity: 0.3;
            :hover {
              opacity: 1;
            }
          `}
        >
          <TooltipExt title={'Edit'}>
            <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faEdit').faEdit} transform={{ size: 15, x: -3, y: 0 }} style={{ color: 'white', cursor: 'pointer', marginLeft: '4px' }} />
          </TooltipExt>
        </span>
      )}
      {!Utils.isNullOrEmpty(props.suffix) && valueShow === value && (
        <span
          css={`
            margin-left: 4px;
          `}
        >
          {props.suffix}
        </span>
      )}
    </span>
  );
});

export default EditNumberSpan;
