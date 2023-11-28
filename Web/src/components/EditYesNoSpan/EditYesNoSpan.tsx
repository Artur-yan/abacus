import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Switch from 'antd/lib/switch';
import * as React from 'react';
import { PropsWithChildren, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import TooltipExt from '../TooltipExt/TooltipExt';
const s = require('./EditYesNoSpan.module.css');
const sd = require('../antdUseDark.module.css');

interface IEditYesNoSpanProps {
  value?: any;
  onChange?: (value: any) => void;
  yesValue?: any;
  noValue?: any;
}

const EditYesNoSpan = React.memo((props: PropsWithChildren<IEditYesNoSpanProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const [value, setValue] = useState(props.value);
  const yesValue = props.yesValue || 'Yes';
  const noValue = props.noValue || 'No';
  const [isEditing, setIsEditing] = useState(false);

  const onClickEdit = (e) => {
    setIsEditing(true);
  };

  const onClickSwitch = (v1) => {
    setValue(v1);
  };

  const onClickCancel = (e) => {
    setValue(props.value);
    setIsEditing(false);
  };

  const onClickSet = (e) => {
    props.onChange?.(value);
    setIsEditing(false);
  };

  return (
    <span>
      {isEditing && <Switch onClick={onClickSwitch} checked={!!value} />}
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

      {!isEditing && <span>{value ? yesValue : noValue}</span>}
      {!isEditing && (
        <span
          onClick={onClickEdit}
          css={`
            margin-left: 10px;
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
    </span>
  );
});

export default EditYesNoSpan;
